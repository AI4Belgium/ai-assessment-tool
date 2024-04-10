/**
 * @jest-environment node
 */
import { givenAProject, givenAUser, setupMongoDB } from '@/util/test-utils'
import JobModel from '@/src/models/job'
import { JobDeleteNotification } from '@/src/models/job/job-delete-notification'
// import waitForExpect from 'wait-for-expect'
import * as Mail from '@/util/mail/index'
import { JobStatus } from '@/src/types/job'
import { MAX_USER_AGED_DAYS, daysToMilliseconds } from '@/util/index'
import { getUser, getUsers, updateDeletionFields } from '@/src/models/user'

// because of swc issue, we need to mock the module
jest.mock('../../util/mail/index', () => ({
  ...jest.requireActual('../../util/mail/index'),
  __esModule: true
}))

const baseExpect = async (context: any): Promise<void> => {
  const { user1, user2 } = context
  const userIds = [String(user1._id), String(user2._id)]
  const jobIds = await JobDeleteNotification.createDeleteNotificationIfNotExistingJobs()
  expect(jobIds).toHaveLength(2)
  for (const jobId of jobIds) {
    const job = await JobModel.get(jobId)
    const strUserId = String(job?.data?.userId)
    expect(job).toBeDefined()
    expect(job?.status).toEqual(JobStatus.PENDING)
    expect(job?.type).toEqual(JobDeleteNotification.JOB_TYPE)
    expect(job?.data).toBeDefined()
    expect(userIds).toContain(strUserId)
  }
}

describe('JobDeleteNotification', () => {
  setupMongoDB()
  let spy: jest.SpyInstance
  let spy2: jest.SpyInstance
  let spy3: jest.SpyInstance
  let context: any
  let now: number
  let createdAtOlder: Date

  beforeAll(async () => {
    now = Date.now()
    createdAtOlder = new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS - 2))
    const originalFn = JobDeleteNotification.createDeleteNotificationIfNotExistingJobs.bind(JobDeleteNotification)
    const originalFn2 = Mail.sendMail
    const originalFn3 = JobDeleteNotification.createJob.bind(JobDeleteNotification)
    spy = jest.spyOn(JobDeleteNotification, 'createDeleteNotificationIfNotExistingJobs').mockImplementation(async (...args) => {
      return await originalFn(...args)
    })
    spy2 = jest.spyOn(Mail, 'sendMail').mockImplementation(async (...args) => {
      return await originalFn2(...args)
    })
    spy3 = jest.spyOn(JobDeleteNotification, 'createJob').mockImplementation(async (...args) => {
      const [data, jobType] = args
      data.createdAt = new Date(Date.now() - 1000) // overwrite createdAt to 1 second ago to make it picked in the findAndExecuteJobs
      return await originalFn3(data, jobType)
    })
  })

  beforeEach(async () => {
    const createdAtYounger = new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS - 10))
    const user1 = await givenAUser({ createdAt: createdAtOlder })
    const user2 = await givenAUser({ createdAt: createdAtOlder })
    const user3 = await givenAUser({ createdAt: createdAtYounger })
    const project1 = await givenAProject({}, user1, true)
    const project2 = await givenAProject({}, user2, true)
    context = { user1, user2, user3, project1, project2 }
  })

  afterEach(() => {
    spy.mockClear()
    spy2.mockClear()
    spy3.mockClear()
  })
  afterAll(() => {
    spy.mockRestore()
    spy2.mockRestore()
    spy3.mockRestore()
  })

  describe('.createDeleteNotificationJobs()', () => {
    it('Creates the jobs', async () => {
      await baseExpect(context)
    })

    it('Creates the jobs only once', async () => {
      await baseExpect(context)
      await baseExpect(context) // this check checks if the length of the jobs is still correct
    })

    it('Does not create a job for a user with a deletePreventionDate that is not old enough', async () => {
      const user4 = await givenAUser({ createdAt: createdAtOlder })
      await updateDeletionFields(String(user4._id), new Date())
      await baseExpect(context)
      const jobResuslts = await JobDeleteNotification.find({})
      const userIds: any = []
      for (const job of jobResuslts.data) {
        expect(job.status).toEqual(JobStatus.PENDING)
        userIds.push(String(job.data.userId))
      }
      expect(userIds.includes(String(user4._id))).toBeFalsy()
    })

    it('Creates a job for a user with a deletePreventionDate that is too old', async () => {
      const user4 = await givenAUser({ createdAt: createdAtOlder })
      const deletePreventionDate = new Date(now - daysToMilliseconds((MAX_USER_AGED_DAYS * 2) + 1))
      await updateDeletionFields(String(user4._id), deletePreventionDate)
      const jobIds = await JobDeleteNotification.createDeleteNotificationIfNotExistingJobs()
      expect(jobIds.length).toEqual(3)
      const jobResuslts = await JobDeleteNotification.find({})
      const userIds: any = []
      for (const job of jobResuslts.data) {
        expect(job.status).toEqual(JobStatus.PENDING)
        userIds.push(String(job.data.userId))
      }
      expect(userIds.includes(String(user4._id))).toBeTruthy()
    })

    it('Creates a job for a user with a deletePreventionDate and deleteNotificationSentDate that are too old', async () => {
      const user4 = await givenAUser({ createdAt: createdAtOlder })
      const deleteNotificationSentDate = new Date(now - daysToMilliseconds((MAX_USER_AGED_DAYS * 2) + 5))
      const deletePreventionDate = new Date(now - daysToMilliseconds((MAX_USER_AGED_DAYS * 2) + 1))
      await updateDeletionFields(String(user4._id), deletePreventionDate, deleteNotificationSentDate)
      const jobIds = await JobDeleteNotification.createDeleteNotificationIfNotExistingJobs()
      expect(jobIds.length).toEqual(3)
      const jobResuslts = await JobDeleteNotification.find({})
      const userIds: any = []
      for (const job of jobResuslts.data) {
        expect(job.status).toEqual(JobStatus.PENDING)
        userIds.push(String(job.data.userId))
      }
      expect(userIds.includes(String(user4._id))).toBeTruthy()
    })
  })

  describe('.findAndExecuteJobs()', () => {
    it('Call the sendMail function with the right email addresses', async () => {
      const { user1, user2, user3 } = context
      await baseExpect(context)
      await JobDeleteNotification.findAndExecuteJobs()
      expect(spy2).toBeCalledTimes(2)
      const emails: string[] = spy2.mock.calls.map((call: any) => call[0])
      expect(emails).toContain(user1.email)
      expect(emails).toContain(user2.email)
      expect(emails).not.toContain(user3.email)
    })

    it('Sets the job status correctly', async () => {
      await baseExpect(context)
      await JobDeleteNotification.findAndExecuteJobs()
      expect(spy2).toBeCalledTimes(2)
      const jobResuslts = await JobDeleteNotification.find({})
      expect(jobResuslts.count).toEqual(2)
      for (const job of jobResuslts.data) {
        expect(job.status).toEqual(JobStatus.FINISHED)
      }
    })

    it('Sets the users deleteNotificationSentDate', async () => {
      const currentDate = new Date().setHours(0, 0, 0, 0)
      const { user1, user2, user3 } = context
      await baseExpect(context)
      await JobDeleteNotification.findAndExecuteJobs()
      expect(spy2).toBeCalledTimes(2)
      const users = await getUsers([user1._id, user2._id])
      for (const user of users) {
        expect(user.deleteNotificationSentDate).not.toBeUndefined()
        expect(+(user.deleteNotificationSentDate?.setHours(0, 0, 0, 0) ?? -1)).toEqual(+currentDate)
      }
      const user = await getUser({ _id: user3._id })
      expect(user).toBeDefined()
      expect(user?.deleteNotificationSentDate).toBeUndefined()
    })

    it('Won\'t create new jobs for users with the deleteNotificationSentDate set', async () => {
      await baseExpect(context)
      await JobDeleteNotification.findAndExecuteJobs()
      // will set the deleteNotificationSentDate too
      expect(spy2).toBeCalledTimes(2)
      // recall made of jobs
      const jobIds = await JobDeleteNotification.createDeleteNotificationIfNotExistingJobs()
      expect(jobIds.length).toEqual(0)
    })

    it('Job gets canceled if meanwhile between job creation and run the user updates the deletePreventionDate', async () => {
      const jobIds = await JobDeleteNotification.createDeleteNotificationIfNotExistingJobs()
      expect(jobIds.length).toEqual(2)
      const { user1 } = context
      await updateDeletionFields(String(user1._id), new Date()) // prevent deletion
      await JobDeleteNotification.findAndExecuteJobs()
      const jobResuslts = await JobDeleteNotification.find({})
      expect(jobResuslts.count).toEqual(2)
      for (const job of jobResuslts.data) {
        if (String(job.data.userId) === String(user1._id)) {
          expect(job.status).toEqual(JobStatus.CANCELLED)
        } else {
          expect(job.status).toEqual(JobStatus.FINISHED)
        }
      }
    })
  })
})

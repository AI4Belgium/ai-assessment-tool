/**
 * @jest-environment node
 */
import { givenAProject, givenAUser, givenAUserWithDeleteNotificationSentAndDeletePreventionDatePastMaxtime, setupMongoDB } from '@/util/test-utils'
import { JobDeleteUserData } from '@/src/models/job/job-delete-user-data'
// import waitForExpect from 'wait-for-expect'
import * as Mail from '@/util/mail/index'
import { JobStatus } from '@/src/types/job'
import { MAX_USER_AGED_DAYS, daysToMilliseconds } from '@/util/index'
import { getUser, getUsers, updateDeletionFields, updateToDeletedUser } from '@/src/models/user'
import ProjectModel from '@/src/models/project'

// because of swc issue, we need to mock the module
jest.mock('../../util/mail/index', () => ({
  ...jest.requireActual('../../util/mail/index'),
  __esModule: true
}))

describe('JobDeleteUserData', () => {
  setupMongoDB()
  let spy: jest.SpyInstance
  let spy2: jest.SpyInstance
  let spy3: jest.SpyInstance
  let context: any
  let now: number

  beforeAll(async () => {
    now = Date.now()
    const originalFn = JobDeleteUserData.createJobsIfNotExisting.bind(JobDeleteUserData)
    const originalFn2 = Mail.sendMail
    const originalFn3 = JobDeleteUserData.createJob.bind(JobDeleteUserData)
    spy = jest.spyOn(JobDeleteUserData, 'createJobsIfNotExisting').mockImplementation(async (...args) => {
      return await originalFn(...args)
    })
    spy2 = jest.spyOn(Mail, 'sendMail').mockImplementation(async (...args) => {
      return await originalFn2(...args)
    })
    spy3 = jest.spyOn(JobDeleteUserData, 'createJob').mockImplementation(async (...args) => {
      const [data, jobType] = args
      data.createdAt = new Date(Date.now() - 1000) // overwrite createdAt to 1 second ago to make it picked in the findAndExecuteJobs
      return await originalFn3(data, jobType)
    })
  })

  beforeEach(async () => {
    const user1 = await givenAUserWithDeleteNotificationSentAndDeletePreventionDatePastMaxtime()
    const user2 = await givenAUserWithDeleteNotificationSentAndDeletePreventionDatePastMaxtime()
    const user3 = await givenAUserWithDeleteNotificationSentAndDeletePreventionDatePastMaxtime()
    await updateDeletionFields(String(user3._id), new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS / 2))) // prevent deletion
    const user4 = await givenAUser()
    const project1 = await givenAProject({}, user1, true)
    const project2 = await givenAProject({}, user2, true)
    const project3 = await givenAProject({}, user3, true)
    const project4 = await givenAProject({}, user3, true)
    const project5 = await givenAProject({}, user1, true)
    context = { user1, user2, user3, user4, project1, project2, project3, project4, project5 }
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

  describe('.createJobsIfNotExisting()', () => {
    it('Creates the jobs', async () => {
      const jobIds = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds.length).toEqual(2)
    })

    it('Creates the jobs only once', async () => {
      const jobIds = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds.length).toEqual(2)
      const jobIds2 = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds2.length).toEqual(2)
      const jobIdsStr = jobIds.map((id) => String(id)).sort().join(',')
      const jobIds2Str = jobIds2.map((id) => String(id)).sort().join(',')
      expect(jobIdsStr).toEqual(jobIds2Str)
    })

    it('Does not create a job for a user with a deletePreventionDate that is not old enough', async () => {
      let userX: any = await givenAUserWithDeleteNotificationSentAndDeletePreventionDatePastMaxtime()
      userX = await getUser({ _id: userX?._id })
      expect(+(userX?.deleteNotificationSentDate ?? Infinity)).toBeLessThan(+new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS)))
      expect(+(userX?.deletePreventionDate ?? Infinity)).toBeLessThan(+new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS)))
      await updateDeletionFields(String(userX._id), new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS / 2))) // prevent deletion
      userX = await getUser({ _id: userX?._id })
      expect(+(userX?.deletePreventionDate ?? Infinity)).toBeGreaterThan(+new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS)))
      const jobIds = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds.length).toEqual(2)
      const jobResuslts = await JobDeleteUserData.find({})
      expect(jobResuslts.count).toEqual(2)
      const userIds: any = []
      for (const job of jobResuslts.data) {
        expect(job.status).toEqual(JobStatus.PENDING)
        userIds.push(String(job.data.userId))
      }
      expect(userIds.includes(String(userX._id))).toBeFalsy()
    })

    it('Does not create a job for a user with a deleteNotificationSentDate that is not old enough', async () => {
      let userX: any = await givenAUserWithDeleteNotificationSentAndDeletePreventionDatePastMaxtime()
      userX = await getUser({ _id: userX?._id })
      expect(+(userX?.deleteNotificationSentDate ?? Infinity)).toBeLessThan(+new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS)))
      expect(+(userX?.deletePreventionDate ?? Infinity)).toBeLessThan(+new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS)))
      await updateDeletionFields(String(userX._id), null, new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS / 2)))
      userX = await getUser({ _id: userX?._id })
      expect(+(userX?.deleteNotificationSentDate ?? Infinity)).toBeGreaterThan(+new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS)))
      const jobIds = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds.length).toEqual(2)
      const jobResuslts = await JobDeleteUserData.find({})
      expect(jobResuslts.count).toEqual(2)
      const userIds: any = []
      for (const job of jobResuslts.data) {
        expect(job.status).toEqual(JobStatus.PENDING)
        userIds.push(String(job.data.userId))
      }
      expect(userIds.includes(String(userX._id))).toBeFalsy()
    })

    it('Does not create a job for an already deleted user', async () => {
      let userX: any = await givenAUserWithDeleteNotificationSentAndDeletePreventionDatePastMaxtime()
      userX = await getUser({ _id: userX?._id })
      expect(+(userX?.deleteNotificationSentDate ?? Infinity)).toBeLessThan(+new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS)))
      expect(+(userX?.deletePreventionDate ?? Infinity)).toBeLessThan(+new Date(now - daysToMilliseconds(MAX_USER_AGED_DAYS)))
      await updateToDeletedUser(userX._id)
      userX = await getUser({ _id: userX?._id })
      expect(+(userX?.isDeleted)).toBeTruthy()
      const jobIds = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds.length).toEqual(2)
      const jobResuslts = await JobDeleteUserData.find({})
      expect(jobResuslts.count).toEqual(2)
      const userIds: any = []
      for (const job of jobResuslts.data) {
        expect(job.status).toEqual(JobStatus.PENDING)
        userIds.push(String(job.data.userId))
      }
      expect(userIds.includes(String(userX._id))).toBeFalsy()
    })
  })

  describe('.findAndExecuteJobs()', () => {
    it('Deletes all user\'s data', async () => {
      const jobIds = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds.length).toEqual(2)
      const projectsRes = await ProjectModel.find({ })
      expect(projectsRes.data.length).toEqual(5)
      await JobDeleteUserData.findAndExecuteJobs()
      const { user1, user2, project1, project2, project5 } = context
      const users = await getUsers()
      expect(users.length).toEqual(4)
      for (const user of users) {
        if (String(user._id) === String(user1._id)) expect(user.isDeleted).toBeTruthy()
        else if (String(user._id) === String(user2._id)) expect(user.isDeleted).toBeTruthy()
        else expect(user.isDeleted).toBeFalsy()
      }
      const projectsRes2 = await ProjectModel.find({ })
      const expectedDeletedProjectsIdsStrs = [project1, project2, project5].map((p) => String(p._id))
      expect(projectsRes2.data.length).toEqual(2)
      for (const project of projectsRes2.data) {
        expect(expectedDeletedProjectsIdsStrs.includes(String(project._id))).toBeFalsy()
      }
    })

    it('Sets the job status correctly', async () => {
      const jobIds = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds.length).toEqual(2)
      await JobDeleteUserData.findAndExecuteJobs()
      const jobResuslts = await JobDeleteUserData.find({})
      expect(jobResuslts.count).toEqual(2)
      for (const job of jobResuslts.data) {
        expect(job.status).toEqual(JobStatus.FINISHED)
      }
    })

    it('Job gets canceled if meanwhile between job creation and run the user updates the deletePreventionDate', async () => {
      const jobIds = await JobDeleteUserData.createJobsIfNotExisting()
      expect(jobIds.length).toEqual(2)
      const { user1 } = context
      await updateDeletionFields(String(user1._id), new Date()) // prevent deletion
      await JobDeleteUserData.findAndExecuteJobs()
      const jobResuslts = await JobDeleteUserData.find({})
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

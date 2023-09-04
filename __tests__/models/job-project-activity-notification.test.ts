/**
 * @jest-environment node
 */
import { givenAProject, givenAUser, givenAUserAcceptingNotifications, setupMongoDB } from '@/util/test-utils'
import * as ProjectModel from '@/src/models/project'
import * as CardModel from '@/src/models/card'
import JobModel from '@/src/models/job'
import { JobProjectActivityNotification } from '@/src/models/job/job-project-activity-notification'
// import waitForExpect from 'wait-for-expect'
import * as Mail from '@/util/mail/index'
import { JobStatus } from '@/src/types/job'
import { jobFactory } from '@/src/models/job/job-factory'

// because of swc issue, we need to mock the module
jest.mock('../../util/mail/index', () => ({
  ...jest.requireActual('../../util/mail/index'),
  __esModule: true
}))

const baseExpect = async (context: any): Promise<void> => {
  const { user2, user3 } = context
  const userIds = [String(user2._id), String(user3._id)]
  const jobIds = await JobProjectActivityNotification.createProjectActivityNotificationJobs()
  expect(jobIds).toHaveLength(2)
  for (const jobId of jobIds) {
    const job = await JobModel.get(jobId)
    const strUserId = String(job?.data?.userId)
    expect(job).toBeDefined()
    expect(job?.status).toEqual(JobStatus.PENDING)
    expect(job?.type).toEqual(JobProjectActivityNotification.JOB_TYPE)
    expect(job?.data).toBeDefined()
    expect(userIds).toContain(strUserId)
    if (strUserId === String(user3._id)) {
      expect(job?.data?.latestActivityPerProject).toHaveLength(2)
      expect(job?.data?.latestActivityPerProject.every((a: any) => a.sent == null)).toBeTruthy()
    } else {
      expect(job?.data?.latestActivityPerProject).toHaveLength(1)
    }
  }
}

describe('JobProjectActivityNotification', () => {
  setupMongoDB()
  let spy: jest.SpyInstance
  let spy2: jest.SpyInstance
  let spy3: jest.SpyInstance
  let context: any

  beforeAll(async () => {
    const originalFn = JobProjectActivityNotification.createProjectActivityNotificationJobs.bind(JobProjectActivityNotification)
    const originalFn2 = Mail.sendMailToBcc
    const originalFn3 = JobProjectActivityNotification.createJob.bind(JobProjectActivityNotification)
    spy = jest.spyOn(JobProjectActivityNotification, 'createProjectActivityNotificationJobs').mockImplementation(async (...args) => {
      return await originalFn(...args)
    })
    spy2 = jest.spyOn(Mail, 'sendMailToBcc').mockImplementation(async (...args) => {
      return await originalFn2(...args)
    })
    spy3 = jest.spyOn(JobProjectActivityNotification, 'createJob').mockImplementation(async (...args) => {
      const [data, jobType] = args
      data.createdAt = new Date(Date.now() - 1000) // overwrite createdAt to 1 second ago to make it picked in the findAndExecuteJobs
      return await originalFn3(data, jobType)
    })
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

  describe('.createProjectActivityNotificationJobs()', () => {
    beforeEach(async () => {
      const user1 = await givenAUser()
      const user2 = await givenAUser()
      const user3 = await givenAUser()
      const project1 = await givenAProject({}, user1, true)
      const project2 = await givenAProject({}, user2, true)
      await ProjectModel.addUser(project1._id, user2._id)
      await ProjectModel.addUser(project1._id, user3._id)
      await ProjectModel.addUser(project2._id, user3._id)
      context = { user1, user2, user3, project1, project2 }
    })

    it('Creates the jobs', async () => {
      await baseExpect(context)
    })

    it('Creates the job for activities only once', async () => {
      const { user1, user2, user3, project1 } = context
      await baseExpect(context)
      const jobIds2 = await JobProjectActivityNotification.createProjectActivityNotificationJobs()
      expect(jobIds2).toHaveLength(0)
      const jobIds3 = await JobProjectActivityNotification.createProjectActivityNotificationJobs()
      expect(jobIds3).toHaveLength(0)

      const cards = await CardModel.getCards({ projectId: project1._id })
      await CardModel.addUserToCardAndCreateActivity(cards[0]._id, user3._id, user2._id)
      const jobIds4 = await JobProjectActivityNotification.createProjectActivityNotificationJobs()
      const userIds2 = [String(user1._id), String(user2._id)]
      for (const jobId of jobIds4) {
        const job = await JobModel.get(jobId)
        const strUserId = String(job?.data?.userId)
        expect(job).toBeDefined()
        expect(job?.status).toEqual(JobStatus.PENDING)
        expect(job?.type).toEqual(JobProjectActivityNotification.JOB_TYPE)
        expect(job?.data).toBeDefined()
        expect(userIds2.includes(strUserId)).toBeTruthy()
        expect(job?.data?.latestActivityPerProject).toHaveLength(1)
      }
    })
    it('Creates the job for activities only once test 2', async () => {
      const { user1, user2, user3, project2 } = context
      await baseExpect(context)
      const cards = await CardModel.getCards({ projectId: project2._id })
      await CardModel.addUserToCardAndCreateActivity(cards[0]._id, user3._id, user2._id)
      const jobIds2 = await JobProjectActivityNotification.createProjectActivityNotificationJobs()
      const userIds2 = [String(user1._id), String(user2._id)]
      for (const jobId of jobIds2) {
        const job = await JobModel.get(jobId)
        const strUserId = String(job?.data?.userId)
        expect(job).toBeDefined()
        expect(job?.status).toEqual(JobStatus.PENDING)
        expect(job?.type).toEqual(JobProjectActivityNotification.JOB_TYPE)
        expect(job?.data).toBeDefined()
        expect(userIds2.includes(strUserId)).toBeTruthy()
      }
    })
  })
  describe('#run()', () => {
    beforeEach(async () => {
      const user1 = await givenAUser()
      const project1 = await givenAProject({}, context.user1, true)
      context = { user1, project1 }
    })
    it('Sends the email', async () => {
      const user2 = await givenAUserAcceptingNotifications()
      await ProjectModel.addUser(context.project1._id, user2._id)
      const jobIds = await JobProjectActivityNotification.createProjectActivityNotificationJobs()
      expect(jobIds).toHaveLength(1)
      for (const jobId of jobIds) {
        const job = await JobModel.get(jobId)
        const activityJob = jobFactory(job)
        await activityJob.run()
        expect(activityJob.result).toBeDefined()
        expect(activityJob.result).toHaveProperty('accepted')
        expect(activityJob.result).toHaveProperty('rejected')
        expect(activityJob.result).toHaveProperty('response')
        expect(activityJob.result).toHaveProperty('envelope')
        expect(activityJob.result).toHaveProperty('messageId')
      }
    })
    it('Does not send the email if the email is not verified', async () => {
      const user2 = await givenAUserAcceptingNotifications({ emailVerified: false })
      await ProjectModel.addUser(context.project1._id, user2._id)
      const jobIds = await JobProjectActivityNotification.createProjectActivityNotificationJobs()
      expect(jobIds).toHaveLength(1)
      for (const jobId of jobIds) {
        const job = await JobModel.get(jobId)
        const activityJob = jobFactory(job)
        await activityJob.run()
        expect(activityJob.result).toBeDefined()
        expect(activityJob.result).toMatch(/.* not verified.*/i)
      }
    })
    it('Does not send the email if the user has disabled project avtivity notifications', async () => {
      const user2 = await givenAUserAcceptingNotifications({ }, { projectActivity: false })
      await ProjectModel.addUser(context.project1._id, user2._id)
      const jobIds = await JobProjectActivityNotification.createProjectActivityNotificationJobs()
      expect(jobIds).toHaveLength(1)
      for (const jobId of jobIds) {
        const job = await JobModel.get(jobId)
        const activityJob = jobFactory(job)
        await activityJob.run()
        expect(activityJob.result).toBeDefined()
        expect(activityJob.result).toMatch(/.* disabled project activity notifications.*/i)
      }
    })
  })
})

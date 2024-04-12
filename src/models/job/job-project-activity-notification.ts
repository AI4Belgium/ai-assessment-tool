import { ObjectId } from 'mongodb'
import { Job as JobInterface, JobStatus } from '@/src/types/job'
import isEmpty from 'lodash.isempty'
import Activity from '@/src/models/activity'
import { Activity as ActivityTypeDef } from '@/src/types/activity'
import Job from '@/src/models/job'
import UserModel from '@/src/models/user'
import { getUserProjectIds, getUserProjects } from '@/src/models/project'
import { getProjectActivityHtml } from '@/util/mail/templates'
import { sendMailWithSelfInBcc } from '@/util/mail'
import { User } from '@/src/types/user'
import { toObjectId } from '@/src/models/mongodb'
import { getNotificationSetting } from '@/src/models/notification-setting'

export type PartialActivityTypeDef = Pick<ActivityTypeDef, 'createdAt' | '_id' | 'projectId' | 'type' | 'createdBy'> & { sent?: boolean }

export interface JobProjectActivityNotificationData {
  latestActivityPerProject: PartialActivityTypeDef[]
  userId: string
}

export class JobProjectActivityNotification extends Job {
  static JOB_TYPE = 'project-activity-notification'
  data?: JobProjectActivityNotificationData

  // TODO break this up into smaller functions
  static async createProjectActivityNotificationJobs (): Promise<ObjectId[]> {
    const maxAgeDate = new Date(Date.now() - 60 * 60 * 1000 * 24) // last 24 hours
    const where = { isDeleted: { $ne: true } }
    const generator = UserModel.findGenerator(where)
    const jobIds = []
    for await (const user of generator) {
      const latestActivityPerProject = await this.getLatestActivityPerProject(user, maxAgeDate)
      if (!isEmpty(latestActivityPerProject)) {
        const latestJob = await this.getLatestJobForUser(user._id)
        const jobId = await this.createJobIfNecessary(latestActivityPerProject, latestJob as JobProjectActivityNotification, user)
        if (jobId != null) jobIds.push(jobId)
      }
    }
    return jobIds
  }

  static mapNotSeenActivity (latestActivityPerProject: PartialActivityTypeDef[], latestJob: JobProjectActivityNotification | null): any[] {
    if (latestJob == null || latestJob.data == null || latestJob.data.latestActivityPerProject == null) return latestActivityPerProject
    const { latestActivityPerProject: seenActivitiesPerProject } = latestJob.data
    return latestActivityPerProject.map((latestProjectActivity: PartialActivityTypeDef) => {
      const { projectId, _id, createdAt } = latestProjectActivity
      const seenActivity = seenActivitiesPerProject.find((seenProjectActivity: PartialActivityTypeDef) => String(seenProjectActivity.projectId) === String(projectId))
      if (seenActivity == null) return latestProjectActivity // no activity seen for this project
      if (+seenActivity.createdAt < +createdAt) return latestProjectActivity // new activity for this project
      if (String(seenActivity._id) === String(_id)) return { ...latestProjectActivity, sent: true } // activity already seen, we need to keep it in the list to avoid sending it again
      return { ...latestProjectActivity, sent: true } // new activity for this project, but we already sent a notification for it for an older activity, should not happen
    })
  }

  static async createJobIfNecessary (latestActivityPerProject: PartialActivityTypeDef[], latestJob: JobProjectActivityNotification | null, user: User): Promise<ObjectId | null> {
    const mappedLatestActivityPerProject = this.mapNotSeenActivity(latestActivityPerProject, latestJob)
    if (isEmpty(mappedLatestActivityPerProject)) return null
    if (mappedLatestActivityPerProject.some((activity: PartialActivityTypeDef) => activity.sent !== true)) {
      const job: Partial<JobInterface> = {
        data: {
          latestActivityPerProject: mappedLatestActivityPerProject,
          userId: user._id
        }
      }
      return await this.createJob(job, this.JOB_TYPE)
    } else {
      return null
    }
  }

  static async getLatestActivityPerProject (user: User, activityMaxAgeDate: Date): Promise<PartialActivityTypeDef[]> {
    if (user?._id == null) return []
    const userProjectIds = await getUserProjectIds(user._id)
    if (isEmpty(userProjectIds)) return []
    const where = {
      createdAt: { $gt: activityMaxAgeDate },
      createdBy: { $ne: user._id },
      seenBy: { $ne: user._id },
      projectId: { $in: userProjectIds }
    }
    const projectIdActivityObj: { [key: string]: PartialActivityTypeDef } = { }
    const generator = Activity.findGenerator(where)
    for await (const activity of generator) {
      const { projectId, createdAt, _id, type, createdBy } = activity
      const strProjectId = String(projectId)
      if (projectIdActivityObj[strProjectId] == null || +projectIdActivityObj[strProjectId].createdAt < +createdAt) projectIdActivityObj[strProjectId] = { projectId, createdAt, _id, type, createdBy }
    }
    return Object.values(projectIdActivityObj)
  }

  static async getLatestJobForUser (userId: ObjectId | string): Promise<JobInterface | null> {
    userId = toObjectId(userId)
    const resultObj = await this.find({ type: this.JOB_TYPE, 'data.userId': userId }, 1, ['createdAt', -1])
    return resultObj?.data?.[0] ?? null
  }

  async run (): Promise<any> {
    if (Date.now() - +this.createdAt > 60 * 60 * 1000 * 24) {
      this.status = JobStatus.CANCELLED
      this.result = 'Job too old'
      return
    }
    const { latestActivityPerProject, userId } = this.data as JobProjectActivityNotificationData
    const latestActivityPerProjectToSend = latestActivityPerProject.filter((activity: PartialActivityTypeDef) => activity.sent !== true)
    const projectIds = latestActivityPerProjectToSend.map((activity: PartialActivityTypeDef) => activity.projectId)
    if (isEmpty(projectIds)) {
      this.result = 'No projects to notify'
      return
    }
    const user = await UserModel.get(userId)
    if (user == null) throw Error(`User not found: ${userId}`)
    if (user.emailVerified !== true) {
      this.result = 'User email not verified'
      return
    }
    const notification = await getNotificationSetting(user._id)
    if (notification == null || !notification.projectActivity) {
      this.result = 'User has disabled project activity notifications'
      return
    }
    const projects = await getUserProjects(userId, projectIds)
    if (isEmpty(projects)) throw Error(`No projects found for user: ${userId}`)
    const html = getProjectActivityHtml(projects)
    this.result = await sendMailWithSelfInBcc(user.email, 'New Project Activity', html)
  }
}

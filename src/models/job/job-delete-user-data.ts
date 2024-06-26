import { ObjectId } from 'mongodb'
import { Job as JobInterface, JobStatus } from '@/src/types/job'
import isEmpty from 'lodash.isempty'
import Job from '@/src/models/job'
import UserModel, { updateToDeletedUser, getUser } from '@/src/models/user'
import { deleteUserProjects } from '@/src/models/project'
import { deleteProjectActivities } from '@/src/models/activity'
import { MAX_USER_AGED_DAYS, DAYS_BETWEEN_NOTIFICATION_AND_DELETE, daysToMilliseconds } from '@/util/index'

export const DAYS_TO_SEND_DELETE_NOTIFICATION = MAX_USER_AGED_DAYS + DAYS_BETWEEN_NOTIFICATION_AND_DELETE

function getUserQuery (): any {
  const nowMilliseconds: number = new Date().setHours(0, 0, 0, 0)
  const deletionDaysOld = new Date(nowMilliseconds - daysToMilliseconds(MAX_USER_AGED_DAYS)) // last MAX_USER_AGED_DAYS days
  const notificationDaysOld = new Date(+nowMilliseconds - daysToMilliseconds(DAYS_BETWEEN_NOTIFICATION_AND_DELETE)) // times two to be safe
  const where = {
    $and: [
      {
        $or: [
          {
            deletePreventionDate: {
              $lt: deletionDaysOld,
              $exists: true
            },
            // need to specify the date range because we could match with the previous deleteNotificationSentDate
            deleteNotificationSentDate: { // should be after the MAX_USER_AGED_DAYS but older then the days between notification and delete
              $exists: true,
              $lt: notificationDaysOld, // older than the notification date number of days before deletion
              $gt: deletionDaysOld // after the MAX_USER_AGED_DAYS
            } // more than 4 days before deletion but not the previous deleteNotificationSentDate
          },
          {
            deletePreventionDate: {
              $exists: false
            },
            deleteNotificationSentDate: {
              $exists: true,
              $lt: notificationDaysOld, // older than the notification date number of days before deletion. Example notifcation should be at least 7 days old
              $gt: deletionDaysOld // after the MAX_USER_AGED_DAYS
            }
          }
        ]
      },
      {
        isDeleted: { $ne: true }
      }
    ]
  }
  return where
}

export interface JobDeleteUserDataData {
  userId: string
}

export class JobDeleteUserData extends Job {
  static JOB_TYPE = 'user-data-delete'
  data?: JobDeleteUserDataData

  static async createJobsIfNotExisting (): Promise<ObjectId[]> {
    const where = getUserQuery()
    // console.log('where', JSON.stringify(where, null, 2))
    const generator = UserModel.findGenerator(where)
    const jobIds = []
    for await (const user of generator) {
      const job: Partial<JobInterface> = {
        data: {
          userId: user._id
        }
      }
      const existingJobs = await Job.find({ type: this.JOB_TYPE, 'data.userId': user._id, status: { $in: [JobStatus.EXECUTING, JobStatus.PENDING] } })
      let jobId
      if (existingJobs?.data?.length > 0) {
        jobId = existingJobs.data[0]._id
      } else {
        jobId = await this.createJob(job, this.JOB_TYPE)
      }
      if (jobId != null) jobIds.push(jobId)
    }
    return jobIds
  }

  async run (): Promise<any> {
    const { userId } = this.data as JobDeleteUserDataData
    const user = await getUser({ _id: userId })
    if (user?.deletePreventionDate instanceof Date && +new Date(Date.now() - daysToMilliseconds(MAX_USER_AGED_DAYS)) < +user?.deletePreventionDate) {
      this.result = 'User has a upated deletion prevention date'
      this.status = JobStatus.CANCELLED
      return
    }
    if (isEmpty(user?._id)) return
    for await (const projectId of deleteUserProjects(String(user?._id))) {
      await deleteProjectActivities(projectId)
    }
    if (user?.isDeleted !== true) await updateToDeletedUser(String(user?._id))
  }
}

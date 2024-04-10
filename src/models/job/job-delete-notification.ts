import { ObjectId } from 'mongodb'
import { Job as JobInterface, JobStatus } from '@/src/types/job'
import templates from '@/util/mail/templates'
import { sendMail } from '@/util/mail'
import Job from '@/src/models/job'
import UserModel, { getUser, updateDeletionFields } from '@/src/models/user'
import { MAX_USER_AGED_DAYS, daysToMilliseconds, DAYS_BETWEEN_NOTIFICATION_AND_DELETE } from '@/util/index'

function getUserQuery (): any {
  const startDate = new Date().setHours(0, 0, 0, 0)
  // last MAX_USER_AGED_DAYS - DAYS_BETWEEN_NOTIFICATION_AND_DELETE days because we need to send notification before deletion
  const maxAgeDate = new Date(+startDate - daysToMilliseconds(MAX_USER_AGED_DAYS - DAYS_BETWEEN_NOTIFICATION_AND_DELETE))
  const where = {
    $and: [
      {
        $or: [
          {
            deletePreventionDate: { $lt: maxAgeDate, $exists: true },
            deleteNotificationSentDate: { $exists: false }
          },
          {
            deletePreventionDate: { $lt: maxAgeDate, $exists: true },
            deleteNotificationSentDate: { $exists: true, $lt: maxAgeDate }
          },
          // no deletePreventionDate but deleteNotificationSentDate exists
          {
            deletePreventionDate: { $exists: false },
            deleteNotificationSentDate: { $exists: true, $lt: maxAgeDate },
            createdAt: { $lt: maxAgeDate }
          },
          // no deleteNotificationSentDate and deletePreventionDate
          {
            deletePreventionDate: { $exists: false },
            deleteNotificationSentDate: { $exists: false },
            createdAt: { $lt: maxAgeDate }
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

export interface JobDeleteNotificationData {
  userId: string
}

export class JobDeleteNotification extends Job {
  static JOB_TYPE = 'data-delete-notification'
  data?: JobDeleteNotificationData

  /**
   * @returns ObjectId[] - array of job ids of jobs that should run based on the user query
   */
  static async createDeleteNotificationIfNotExistingJobs (): Promise<ObjectId[]> {
    const where = getUserQuery()
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

  async run (): Promise<any | null> {
    const { userId } = this.data as JobDeleteNotificationData
    const user = await getUser({ _id: userId })
    if (user == null || user.isDeleted === true) return null
    if (user.email == null) throw new Error('User email is missing')
    if (user?.deletePreventionDate instanceof Date && +new Date(Date.now() - daysToMilliseconds(MAX_USER_AGED_DAYS)) < +user?.deletePreventionDate) {
      this.result = 'User has a upated deletion prevention date'
      this.status = JobStatus.CANCELLED
      return
    }
    const htmlContent = templates.deletedUserAccountNotificationHtml()
    await sendMail(user.email, 'Your account and data will be deleted', htmlContent)
    await updateDeletionFields(userId, null, new Date())
  }
}

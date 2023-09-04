import { ObjectId } from 'mongodb'
import isEmpty from 'lodash.isempty'
import { toObjectId } from '@/src/models/mongodb'
import { Job as JobInterface, JobStatus } from '@/src/types/job'
import { Comment as CommentInterface } from '@/src/types/comment'
import { Comment as CommentModel } from '@/src/models/comment'
import { getUser } from '@/src/models/user'
import { sendMailToBcc } from '@/util/mail'
import { commentMentionHtml } from '@/util/mail/templates'
import Job from '@/src/models/job'
import { getNotificationSetting } from '@/src/models/notification-setting'

export interface JobMentionNotificationData {
  userIds: string[]
  commentId: string
  updatedAt: number
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class JobMentionNotification extends Job {
  static JOB_TYPE = 'mention-notification'
  data?: JobMentionNotificationData

  static async createMentionNotificationJob (comment: CommentInterface | ObjectId, delaySeconds = 60 * 60): Promise<ObjectId | null> {
    if (comment instanceof ObjectId) {
      comment = await CommentModel.get(comment)
    }
    const { _id, userIds, updatedAt } = comment as CommentInterface
    if (isEmpty(userIds) || _id == null) return null
    const job: Partial<JobInterface> = {
      data: {
        userIds,
        commentId: _id,
        updatedAt
      },
      delaySeconds
    }
    return await this.createJob(job, this.JOB_TYPE)
  }

  async run (): Promise<any> {
    if (this.data == null) throw Error('Invalid job data, data is null')
    const { commentId, updatedAt: originalUpdatedAt }: JobMentionNotificationData = this.data
    const comment = await CommentModel.get(commentId)
    if (comment == null) throw Error('Comment not found')
    let result: string = ''
    if (comment.deletedAt != null) result = 'Comment deleted'
    const { projectId, userId, userIds = [], text, updatedAt, cardId } = comment
    if (updatedAt !== originalUpdatedAt && updatedAt != null && originalUpdatedAt != null) result = `${result} Comment was updated`
    if (isEmpty(userIds)) result = `${result} No users to notify`
    if (!isEmpty(result)) {
      this.status = JobStatus.CANCELLED
      this.result = result
      return false
    }
    if (projectId == null || userId == null || text == null) throw Error('Invalid comment')
    const emails: string[] = []
    for (const uid of userIds) {
      const user = await getUser({ _id: toObjectId(uid) })
      if (user?._id == null || user.emailVerified !== true) continue
      const notification = await getNotificationSetting(user._id)
      if (notification == null || !notification.mentions) continue
      emails.push(user.email)
    }
    if (!isEmpty(emails)) {
      const html = commentMentionHtml(commentId, projectId, cardId)
      this.result = await sendMailToBcc('You are mentioned in a comment', html, null, emails)
    }
  }
}

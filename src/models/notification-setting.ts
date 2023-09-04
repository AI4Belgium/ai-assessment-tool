import { ObjectId } from 'mongodb'
import isEmpty from 'lodash.isempty'
import { connectToDatabase, toObjectId } from '@/src/models/mongodb'
import { NotificationSetting } from '@/src/types/notification-setting'

export const TABLE_NAME = 'notificationSettings'

export const upsertNotificationSetting = async ({ _id, mentions, projectActivity }: { _id: string | ObjectId, mentions: boolean, projectActivity: boolean }): Promise<any> => {
  const { db } = await connectToDatabase()
  const data: Partial<NotificationSetting> = {
    _id: toObjectId(_id), // userId
    mentions,
    projectActivity
  }

  const notificationExists = await getNotificationSetting(_id)
  if (isEmpty(notificationExists)) {
    await db.collection(TABLE_NAME).insertOne(data)
  } else {
    await db.collection(TABLE_NAME).updateOne({ _id }, { $set: { mentions, projectActivity } })
  }
}

export const getNotificationSetting = async (_id: ObjectId | string): Promise<NotificationSetting> => {
  const { db } = await connectToDatabase()
  const response = await db.collection(TABLE_NAME).findOne({ _id })
  return response
}

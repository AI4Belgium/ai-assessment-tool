import { ObjectId } from 'mongodb'
import isEmpty from 'lodash.isempty'
import { connectToDatabase, toObjectId } from '@/src/models/mongodb'
import { Notification } from '@/src/types/notification'

export const TABLE_NAME = 'notifications'

export const upsertNotification = async ({ _id, mentions, projectActivity }: { _id: string | ObjectId, mentions: boolean, projectActivity: boolean }): Promise<any> => {
  const { db } = await connectToDatabase()
  const data: Partial<Notification> = {
    _id: toObjectId(_id), // userId
    mentions,
    projectActivity
  }

  const notificationExists = await getNotifications(_id)
  if (isEmpty(notificationExists)) {
    await db.collection(TABLE_NAME).insertOne(data)
  } else {
    await db.collection(TABLE_NAME).updateOne({ _id }, { $set: { mentions, projectActivity } })
  }
}

export const getNotifications = async (_id: ObjectId | string): Promise<Notification> => {
  const { db } = await connectToDatabase()
  const response = await db.collection(TABLE_NAME).findOne({ _id })
  return response
}

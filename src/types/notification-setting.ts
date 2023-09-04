import { ObjectId } from 'mongodb'
export interface NotificationSetting {
  _id: string | ObjectId // userId
  mentions: boolean
  projectActivity: boolean
}

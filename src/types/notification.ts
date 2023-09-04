import { ObjectId } from 'mongodb'
export interface Notification {
  _id: string | ObjectId // userId
  mentions: boolean
  projectActivity: boolean
}

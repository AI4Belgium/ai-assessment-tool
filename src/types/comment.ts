import { ObjectId } from 'mongodb'
import { User } from '@/src/types/user'

export interface Comment {
  _id: string | ObjectId
  text: string
  projectId: string | ObjectId
  userId: string | ObjectId
  user: User
  questionId: string
  cardId: string | ObjectId
  userIds?: Array<string | ObjectId>
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
  deletedBy?: string | ObjectId
  parentId?: string | ObjectId
  parent?: Comment
}

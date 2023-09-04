import { User } from './user'
import { Project, Role } from './project'
import { Card, Question } from './card'
import { Comment } from './comment'
import { ObjectId } from 'mongodb'

export enum ActivityType {
  PROJECT_CREATE = 'project_create',
  PROJECT_UPDATE_NAME = 'project_update_name',
  PROJECT_UPDATE_DESCRIPTION = 'project_update_description',
  PROJECT_UPDATE_INDUSTRY = 'project_update_description',
  PROJECT_UPDATE = 'project_update',
  PROJECT_DELETE = 'project_delete',
  PROJECT_USER_ADD = 'project_user_add',
  PROJECT_USER_REMOVE = 'project_user_remove',
  ROLE_CREATE = 'role_create',
  ROLE_UPDATE = 'role_update',
  ROLE_DELETE = 'role_delete',
  ROLE_USER_ADD = 'role_user_add',
  ROLE_USER_REMOVE = 'project_role_user_remove',
  COMMENT_CREATE = 'comment_create',
  COMMENT_UPDATE = 'comment_update',
  COMMENT_DELETE = 'comment_delete',
  COMMENT_MENTION = 'comment_mention',
  COMMENT_CREATE_AND_MENTION = 'comment_create_and_mention',
  COMMENT_UPDATE_AND_MENTION = 'comment_update_and_mention',
  CARD_USER_ADD = 'card_user_add',
  CARD_USER_REMOVE = 'card_user_remove',
  CARD_DUE_DATE_ADD = 'card_due_date_add',
  CARD_DUE_DATE_UPDATE = 'card_due_date_update',
  CARD_DUE_DATE_DELETE = 'card_due_date_delete',
  CARD_COLUMN_UPDATE = 'card_column_update',
  CARD_STAGE_UPDATE = 'card_stage_update',
  QUESTION_RESPONSE_UPDATE = 'question_answer_update',
  QUESTION_CONCLUSION_UPDATE = 'question_conclusion_update'
}

export enum ActivityVisibility {
  PUBLIC = 0
}

export interface ActivityData {
  name?: string
  industry?: string
  columnName?: string
  [key: string]: any
}

export interface Activity {
  _id: string | ObjectId
  createdAt: Date
  type: ActivityType
  createdBy: string | ObjectId
  projectId: string | ObjectId
  visibility: number
  updatedAt?: Date
  data?: ActivityData
  userIds?: Array<string | ObjectId>
  roleId?: string | ObjectId
  cardId?: string | ObjectId
  commentId?: string | ObjectId
  questionId?: string | ObjectId
  seenBy?: Array<string | ObjectId>
}

export type DisplayActivity = Activity & {
  creator: Omit<User, 'password'>
  project: Omit<Project, 'userIds' | 'roles' | 'description'>
  card?: Omit<Card, 'userIds' | 'projectId' | 'createdAt' | 'updatedAt'>
  comment?: Comment
  question?: Question
  role?: Partial<Role>
  users?: Array<Omit<User, 'password'>>
}

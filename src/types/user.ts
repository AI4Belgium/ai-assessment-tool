export interface User {
  _id?: string
  email: string
  password?: string
  firstName: string
  lastName: string
  emailVerified?: Boolean
  avatar?: string
  xsAvatar?: string
  createdAt?: Date
  isDeleted?: boolean
  deletedAt?: Date
  deleteNotificationSentDate?: Date
  deletePreventionDate?: Date
}

export type UserCreate = Pick<User, 'email' | 'password' | 'firstName' | 'lastName'> & { emailVerified?: Boolean }

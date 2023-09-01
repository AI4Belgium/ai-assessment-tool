import { ObjectId } from 'mongodb'
import uniqid from 'uniqid'
import isEmpty from 'lodash.isempty'
import { connectToDatabase, toObjectId, cleanEmail, sanitize } from '@/src/models/mongodb'
import { getUser, updateUser } from '@/src/models/user'
import { randomIntFromInterval } from '@/util/index'
import { addUser, getUserProjects, removeUserInactive } from '@/src/models/project'

const TABLE_NAME = 'tokens'
export const RESET_PASSWORD_TOKEN_EXPIRATION = +(process.env.RESET_PASSWORD_TOKEN_EXPIRATION ?? 3600 * 2 * 1000) // 2 hours
export const EMAIL_VERIFICATION_TOKEN_EXPIRATION = +(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRATION ?? 3600 * 24 * 1000) // 24 hours

export enum TokenStatus {
  PENDING = 'PENDING',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED'
}

export enum TokenType {
  INVITE = 'INVITE',
  RESET_PASSWORD = 'RESET_PASSWORD',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION'
}

export interface Token {
  _id?: ObjectId
  token: string
  userId?: ObjectId
  status: TokenStatus
  type: TokenType
  email: string
  projectId: ObjectId
  createdBy?: ObjectId
  createdAt: Date
}

export const getToken = async (where: any): Promise<Token | null> => {
  const { db } = await connectToDatabase()
  const whereCleaned = sanitize(where)
  if (where._id != null) whereCleaned._id = toObjectId(whereCleaned._id)
  if (where.createdBy != null) whereCleaned.createdBy = toObjectId(whereCleaned.createdBy)
  // console.log(where)
  if (isEmpty(where)) return null
  if (isEmpty(where.token) && isEmpty(where._id)) return await db.collection(TABLE_NAME).find(where).sort({ createdAt: -1 }).limit(1).next()
  return await db.collection(TABLE_NAME).findOne(where)
}

export const invitedUserHandler = async (token: string, email: string): Promise<void> => {
  token = sanitize(token)
  email = cleanEmail(email)
  const { db } = await connectToDatabase()
  const dbToken = await db.collection(TABLE_NAME).findOne({ token })
  if (dbToken != null) {
    const { projectId, status } = dbToken
    if (status === TokenStatus.PENDING && projectId != null) {
      const user = await getUser({ email })
      if (user?._id != null) {
        await addUser(projectId, user?._id)
        await removeUserInactive(projectId, user?._id)
        await setStatus(token, TokenStatus.REDEEMED)
      }
    }
  }
}

export const deleteToken = async (_id: string | ObjectId): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const res = await db.collection(TABLE_NAME).deleteOne({ _id })
  return res.deletedCount === 1
}

export const setStatus = async (token: string | any, status: TokenStatus): Promise<boolean> => {
  const { db } = await connectToDatabase()
  const where: any = {}
  if (typeof token === 'string') where.token = token
  else if (token?._id != null) where._id = toObjectId(token._id)
  else {
    throw new Error('Invalid token')
  }
  const res = await db.collection(TABLE_NAME).updateOne(where, { $set: { status } })
  return res.result.ok === 1
}

export const inviteUser = async (projectId: string | ObjectId, email: string, createdBy: string | ObjectId): Promise<Token> => {
  const token = uniqid()
  const { db } = await connectToDatabase()
  projectId = toObjectId(projectId)
  createdBy = toObjectId(createdBy)
  const user = await getUser({ email })
  if (user?._id != null) {
    const projects = await getUserProjects(user?._id, projectId)
    if (projects?.length > 0) throw new Error('Duplicate invite. Email already used for invitation.')
  }
  const invitations = await getProjectInvites(projectId)
  if (invitations?.length > 0) {
    const invitedUser = invitations.find(invitation => invitation.email === email)
    if (invitedUser != null) throw new Error('Duplicate invite. Email already used for invitation.')
  }
  await db.collection(TABLE_NAME)
    .insertOne({ token, userId: user?._id, createdBy, status: TokenStatus.PENDING, type: TokenType.INVITE, email, projectId, createdAt: new Date() })
  return await db.collection(TABLE_NAME).findOne({ token })
}

export const emailVerificationTokenHandler = async (token: string, createdBy: string): Promise<void> => {
  token = sanitize(token)
  createdBy = toObjectId(createdBy)
  const { db } = await connectToDatabase()
  const dbToken = await db.collection(TABLE_NAME).findOne({ $or: [{ token }, { token: parseInt(token) }], createdBy, type: TokenType.EMAIL_VERIFICATION })
  if (dbToken == null) throw new Error('Invalid token')
  if (dbToken.status !== TokenStatus.PENDING) throw new Error('Token already used or expired')
  if (isTokenExpired(dbToken)) {
    if (dbToken.status !== TokenStatus.EXPIRED) await setStatus(dbToken, TokenStatus.EXPIRED)
    throw new Error('Token expired')
  }
  const email = dbToken.email
  await updateUser(createdBy, { email, emailVerified: true })
  await setStatus(dbToken, TokenStatus.REDEEMED)
}

export const createEmailVerificationToken = async (email: string, createdBy: string): Promise<Token> => {
  const token = randomIntFromInterval(100000, 999999)
  const { db } = await connectToDatabase()
  createdBy = toObjectId(createdBy)
  email = cleanEmail(email)
  await db.collection(TABLE_NAME).updateMany({ createdBy, type: TokenType.EMAIL_VERIFICATION }, { $set: { status: TokenStatus.EXPIRED } })
  await db.collection(TABLE_NAME)
    .insertOne({ token, userId: createdBy, createdBy, status: TokenStatus.PENDING, type: TokenType.EMAIL_VERIFICATION, email, createdAt: new Date() })
  return await db.collection(TABLE_NAME).findOne({ token, email, createdBy })
}

export const isTokenExpired = (token: Token): boolean => {
  if (token.createdAt == null) return true
  if (token.type === TokenType.RESET_PASSWORD) {
    return +token.createdAt + RESET_PASSWORD_TOKEN_EXPIRATION < Date.now()
  }
  if (token.type === TokenType.EMAIL_VERIFICATION) {
    return +token.createdAt + EMAIL_VERIFICATION_TOKEN_EXPIRATION < Date.now()
  }
  return false
}

export const createResetPasswordToken = async (createdBy: string | ObjectId): Promise<Token> => {
  const token = uniqid()
  const { db } = await connectToDatabase()
  const user = await getUser({ _id: createdBy })
  if (user == null) throw new Error('User not found')
  // expire all other reset password tokens
  await db.collection(TABLE_NAME).updateMany({ userId: user._id, type: TokenType.RESET_PASSWORD }, { $set: { status: TokenStatus.EXPIRED } })
  await db.collection(TABLE_NAME)
    .insertOne({ token, userId: user._id, createdBy: user._id, status: TokenStatus.PENDING, type: TokenType.RESET_PASSWORD, email: user.email, createdAt: new Date() })
  return await db.collection(TABLE_NAME).findOne({ token })
}

export const getProjectInvites = async (projectId: string | ObjectId): Promise<Token[]> => {
  const { db } = await connectToDatabase()
  projectId = toObjectId(projectId)
  return await db.collection(TABLE_NAME).find({
    projectId,
    status: TokenStatus.PENDING,
    $or: [
      { type: TokenType.INVITE },
      { type: { $exists: false } }
    ]
  }).toArray()
}

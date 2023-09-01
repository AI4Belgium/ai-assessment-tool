
import { ObjectId } from 'mongodb'
import { cleanText, connectToDatabase, toObjectId, sanitize } from '@/src/models/mongodb'
import { getUsers } from '@/src/models/user'
import isEmpty from 'lodash.isempty'
import { deleteProjectCards, createCards } from '@/src/models/card'
import { deleteProjectColumns, createProjectDefaultColumns, getTodoColumn } from '@/src/models/column'
import Activity from '@/src/models/activity'
import { ActivityType } from '@/src/types/activity'
import { Project } from '@/src/types/project'
import { User } from '@/src/types/user'
import industries from '@/src/data/industries.json'

export const TABLE_NAME = 'projects'

export const createProject = async ({ name, createdBy, description, industryId }: { name: string, createdBy: ObjectId | string, description?: string, industryId?: string | ObjectId }, addDefaultColumns = true): Promise<string> => {
  const { db } = await connectToDatabase()
  name = cleanText(name)
  createdBy = toObjectId(createdBy)
  const createdAt = new Date()
  const data: Partial<Project> = {
    _id: ObjectId(),
    name,
    createdAt,
    createdBy,
    userIds: []
  }
  if (description != null) data.description = cleanText(description)
  if (industryId != null) {
    const validatedIndustyId = getIndustryObjectId(industryId)
    if (validatedIndustyId != null) data.industryId = validatedIndustyId
  }
  const result = await db.collection(TABLE_NAME).insertOne(data)
  if (addDefaultColumns) await createProjectDefaultColumns(data._id, createdBy)
  return result.insertedId
}

export const createProjectAndActivity = async (data: any, userId: ObjectId | string): Promise<string> => {
  const res = await createProject(data)
  if (res != null) void Activity.createProjectCreateActivity(res, userId, data)
  return res
}

export const createProjectWithDefaultColumnsAndCardsAndActivity = async (data: any, cards: any[], userId: string): Promise<string> => {
  const projectId = await createProjectAndActivity(data, userId)
  const todoColumn = await getTodoColumn(projectId)
  cards = sanitize(cards)
  cards = cards.map(c => ({
    ...c,
    projectId: toObjectId(projectId),
    columnId: toObjectId(todoColumn._id)
  }))
  await createCards(cards)
  return String(projectId)
}

export const getProject = async (_id: ObjectId | string): Promise<Project> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  return await db.collection(TABLE_NAME).findOne({ _id })
}

function getIndustryObjectId (industryId: string | ObjectId): ObjectId | null {
  const industry = industries.find(i => i._id === String(industryId))
  if (industry != null) {
    return toObjectId(industry._id)
  }
  return null
}

export const updateProjectAndCreateActivity = async (_id: ObjectId | string, data: any, userId: ObjectId | string): Promise<boolean> => {
  const res = await updateProject(_id, data)
  if (res) void Activity.createProjectUpdateActivities(_id, userId, data)
  return res
}

export const updateProject = async (_id: ObjectId | string, data: any): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const updateData: any = {}
  const updateableProps = ['name', 'description', 'backgroundImage']
  for (const prop of updateableProps) {
    if (data[prop] != null) updateData[prop] = cleanText(data[prop])
  }
  if (data.industryId != null) {
    const validatedIndustyId = getIndustryObjectId(data.industryId)
    if (validatedIndustyId != null) updateData.industryId = validatedIndustyId
  } else if ('industryId' in data && data.industryId == null) {
    updateData.industryId = null
  }
  if (isEmpty(updateableProps)) return false
  const res = await db
    .collection(TABLE_NAME)
    .updateOne({ _id }, { $set: updateData })
  return res.result.ok === 1
}

export const deleteProjectAndCreateActivity = async (_id: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const project = await getProject(_id)
  const res = await deleteProject(_id)
  if (res) void Activity.createActivity(_id, userId, ActivityType.PROJECT_DELETE, { name: project.name })
  return res
}

export const deleteProject = async (_id: ObjectId | string): Promise<boolean> => {
  _id = toObjectId(_id)
  await deleteProjectCards(_id)
  await deleteProjectColumns(_id)
  const { db } = await connectToDatabase()
  const res = await db
    .collection(TABLE_NAME)
    .deleteOne({ _id })
  return res.result.ok === 1
}

export const getUserProjects = async (userId: ObjectId | string, projectId?: string | ObjectId | Array<string | ObjectId>): Promise<Project[]> => {
  const { db } = await connectToDatabase()
  userId = toObjectId(userId)
  if (typeof projectId === 'string') projectId = toObjectId(projectId)
  if (Array.isArray(projectId)) projectId = projectId.map(p => toObjectId(p))
  const where: any = {
    $or: [
      { userIds: userId },
      { createdBy: userId }
    ]
  }
  if (Array.isArray(projectId)) where._id = { $in: projectId }
  else if (projectId != null) where._id = projectId
  return await db.collection(TABLE_NAME).find(where).toArray()
}

export const getUserProjectIds = async (userId: ObjectId | string): Promise<ObjectId[]> => {
  const { db } = await connectToDatabase()
  userId = toObjectId(userId)
  const where: any = {
    $or: [
      { userIds: userId },
      { createdBy: userId }
    ]
  }
  return ((await db.collection(TABLE_NAME).find(where).project({ _id: 1 }).toArray()) ?? []).map(p => p._id)
}

export const addUserAndCreateActivity = async (_id: ObjectId | string, userId: ObjectId | string, addedUserId: ObjectId | string): Promise<boolean> => {
  const res = await addUser(_id, addedUserId)
  if (res) void Activity.createCardUserAddActivity(_id, userId, addedUserId)
  return res
}

export const removeUserAndCreateActivity = async (_id: ObjectId | string, loggedUserId: ObjectId | string, removedUserId: ObjectId | string): Promise<void> => {
  const res = await removeUser(_id, removedUserId)
  if (res) void Activity.removeUserProjectActivity(_id, loggedUserId, removedUserId)
}

export const addUser = async (_id: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  userId = toObjectId(userId)
  const result = await db
    .collection(TABLE_NAME)
    .updateOne({ _id }, { $addToSet: { userIds: userId } })
  return result.result.ok === 1
}

export const removeUserInactive = async (_id: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  const res = await db.collection(TABLE_NAME).updateOne(
    { _id: toObjectId(_id) },
    {
      $pull: {
        userIdsInactive: toObjectId(userId)
      }
    }
  )
  return res.result.ok === 1
}

export const removeUser = async (_id: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  userId = toObjectId(userId)
  const result = await db
    .collection(TABLE_NAME)
    .updateOne({ _id }, { $pull: { userIds: userId } })
  const addUserListDeleted = await db
    .collection(TABLE_NAME)
    .updateOne({ _id }, { $addToSet: { userIdsInactive: userId } })
  return result.result.ok === 1 && addUserListDeleted.result.ok === 1
}

export const getProjectUsers = async (_id: ObjectId | string, filterUserIds?: Array<string | ObjectId>): Promise<User[]> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const project = await db.collection(TABLE_NAME).findOne({ _id }, { projection: { userIds: 1, createdBy: 1 } })
  let userIds: ObjectId[] = []
  if (project?.userIds != null) userIds.push(...project.userIds, project.createdBy)
  if (filterUserIds != null) {
    filterUserIds = filterUserIds.map(String)
    userIds = userIds.filter(id => filterUserIds?.includes(String(id)))
  }
  return await getUsers(userIds)
}

export const getInactiveProjectUsers = async (_id: ObjectId | string, filterUserIds?: Array<string | ObjectId>): Promise<User[]> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const project = await db.collection(TABLE_NAME).findOne({ _id }, { projection: { userIdsInactive: 1, createdBy: 1 } })
  let userIdsInactive: ObjectId[] = []
  if (project?.userIdsInactive != null) userIdsInactive.push(...project.userIdsInactive)
  if (filterUserIds != null) {
    filterUserIds = filterUserIds.map(String)
    userIdsInactive = userIdsInactive.filter((id: ObjectId) => filterUserIds?.includes(String(id)))
  }
  return await getUsers(userIdsInactive)
}

export const getProjectRoles = async (_id: ObjectId | string): Promise<any[]> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const project = await db.collection(TABLE_NAME).findOne({ _id }, { projection: { roles: 1 } })
  return project?.roles
}

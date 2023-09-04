import { sanitize } from '@/src/models/mongodb'
import { ObjectId } from 'mongodb'
import isEmpty from 'lodash.isempty'
import { TABLE_NAME } from './project'
import { toObjectId, connectToDatabase } from './mongodb'
import Activity from './activity'
import { ActivityType } from '@/src/types/activity'
import { Role } from '@/src/types/project'

export const getRole = async (projectId: ObjectId | string, roleId: ObjectId | string): Promise<Role> => {
  const { db } = await connectToDatabase()
  projectId = toObjectId(projectId)
  roleId = toObjectId(roleId)
  const project = await db.collection(TABLE_NAME).findOne({
    _id: projectId,
    roles: {
      $elemMatch: { _id: roleId }
    }
  },
  { projection: { roles: 1 } })
  return project?.roles.find((role: any) => role._id.toString() === roleId.toString())
}

export const addRoles = async (projectId: ObjectId | string, roles: Array<{ _id?: ObjectId | string, name: string, desc: string } >): Promise<boolean> => {
  const { db } = await connectToDatabase()
  projectId = toObjectId(projectId)
  const rolesFormatted: any[] = roles.map(r => {
    r._id = r._id != null ? toObjectId(r._id) : new ObjectId()
    r.name = sanitize(r.name ?? '')
    r.desc = sanitize(r.desc ?? '')
    const { _id, name, desc } = r
    const result = { _id, name, desc, userIds: [], createdAt: new Date() }
    return result
  })

  const res = await db.collection(TABLE_NAME)
    .updateOne({ _id: projectId }, { $push: { roles: { $each: rolesFormatted } } })
  return res.result.ok === 1
}

export const addRole = async (projectId: ObjectId | string, role: { _id?: ObjectId | string, name: string, desc: string }): Promise<Role> => {
  role._id = role._id != null ? toObjectId(role._id) : new ObjectId()
  await addRoles(projectId, [role])
  const roleInserted = await getRole(projectId, role._id)
  return roleInserted
}

export const addRoleAndCreateActivity = async (projectId: ObjectId | string, role: { _id?: ObjectId | string, name: string, desc: string }, userId: ObjectId | string): Promise<Role> => {
  const roleInserted = await addRole(projectId, role)
  if (roleInserted != null) void Activity.createRoleActivity(projectId, userId, roleInserted._id as unknown as ObjectId, roleInserted, ActivityType.ROLE_CREATE)
  return roleInserted
}

export const removeRole = async (projectId: ObjectId | string, roldId: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  projectId = toObjectId(projectId)
  const res = await db
    .collection(TABLE_NAME)
    .updateOne({ _id: projectId }, { $pull: { roles: { _id: toObjectId(roldId) } } })
  return res.result.ok === 1
}

export const removeRoleAndCreateActivity = async (projectId: ObjectId | string, roleId: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const role = await getRole(projectId, roleId)
  const res = await removeRole(projectId, roleId)
  if (res) void Activity.createActivity(projectId, userId, ActivityType.ROLE_DELETE, { name: role.name }, { roleId })
  return res
}

export const updateRoleAndCreateActivity = async (projectId: ObjectId | string, userId: string, role: Partial<Role>): Promise<boolean> => {
  const res = await updateRole(projectId, role)
  if (res && role._id != null) void Activity.createRoleActivity(projectId, userId, role._id, role, ActivityType.ROLE_UPDATE)
  return res
}

export const updateRole = async (projectId: ObjectId | string, role: Partial<Role>): Promise<boolean> => {
  if (role._id == null) throw new Error('Role: missing _id for update')
  const { db } = await connectToDatabase()
  const set: any = {}
  if (role.name != null) set['roles.$.name'] = sanitize(role.name)
  if (role.desc != null) set['roles.$.desc'] = sanitize(role.desc)
  if (isEmpty(set)) return false
  set['roles.$.updateAt'] = new Date()
  const res = await db.collection(TABLE_NAME).updateOne(
    { _id: toObjectId(projectId), 'roles._id': toObjectId(role._id) },
    { $set: set }
  )
  return res.result.ok === 1
}

export const addUserToRoleAndCreateActivity = async (projectId: ObjectId | string, roleId: ObjectId | string, userId: ObjectId | string, userIdAdded: ObjectId | string): Promise<boolean> => {
  const res = await addUserToRole(projectId, roleId, userIdAdded)
  if (res) void Activity.createActivity(projectId, userId, ActivityType.ROLE_USER_ADD, null, { roleId, userIds: [String(userIdAdded)] })
  return res
}

export const removeUserFromRoleAndCreateActivity = async (projectId: ObjectId | string, roleId: ObjectId | string, userId: ObjectId | string, userIdRemoved: ObjectId | string): Promise<boolean> => {
  const res = await removeUserFromRole(projectId, roleId, userIdRemoved)
  if (res) void Activity.createActivity(projectId, userId, ActivityType.ROLE_USER_REMOVE, null, { roleId, userIds: [String(userIdRemoved)] })
  return res
}

export const addUserToRole = async (projectId: ObjectId | string, roleId: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  const res = await db.collection(TABLE_NAME).updateOne(
    { _id: toObjectId(projectId), 'roles._id': toObjectId(roleId) },
    {
      $addToSet: {
        'roles.$.userIds': toObjectId(userId)
      }
    }
  )
  return res.result.ok === 1
}

export const removeUserFromRole = async (projectId: ObjectId | string, roleId: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  const res = await db.collection(TABLE_NAME).updateOne(
    { _id: toObjectId(projectId), 'roles._id': toObjectId(roleId) },
    {
      $pull: {
        'roles.$.userIds': toObjectId(userId)
      }
    }
  )
  return res.result.ok === 1
}


import { ObjectId } from 'mongodb'
import { connectToDatabase, toObjectId, sanitize } from '@/src/models/mongodb'
import isEmpty from 'lodash.isempty'
import { deleteCards } from '@/src/models/card'

export const TABLE_NAME = 'columns'

export enum ColumnName {
  TODO = 'to do',
  BUSY = 'busy',
  DONE = 'done'
}

export const defaultColumns = Object.values(ColumnName)

export const getColumns = async (where: any): Promise<any[]> => {
  const { db } = await connectToDatabase()
  where = sanitize(where)
  if (where._id != null) where._id = toObjectId(where._id)
  if (where.projectId != null) where.projectId = toObjectId(where.projectId)
  return await db.collection(TABLE_NAME).find(where).toArray()
}

export const getColumn = async (where: string | ObjectId | any): Promise<any> => {
  if (where instanceof ObjectId || typeof where === 'string') {
    where = { _id: toObjectId(where) }
  } else {
    where = sanitize(where)
    if (where._id != null) where._id = toObjectId(where._id)
    if (where.projectId != null) where.projectId = toObjectId(where.projectId)
  }
  const { db } = await connectToDatabase()
  return await db.collection(TABLE_NAME).findOne(where)
}

export const createColumn = async (data: any): Promise<any> => {
  const { db } = await connectToDatabase()
  data = sanitize(data)
  data.projectId = toObjectId(data.projectId)
  const result = await db.collection(TABLE_NAME).insertOne(data)
  if (result.result.ok !== 1) return null
  return await getColumn({ _id: result.insertedId })
}

export const createColumns = async (data: any[]): Promise<boolean> => {
  const { db } = await connectToDatabase()
  const createdAt = new Date()
  data = sanitize(data)
  data = data.map(d => {
    if (d.projectId != null) d.projectId = toObjectId(d.projectId)
    if (d.createdBy != null) d.createdBy = toObjectId(d.createdBy)
    if (d.createdAt == null) d.createdAt = createdAt
    return d
  })
  const result = await db.collection(TABLE_NAME).insertMany(data)
  return result.result.ok === 1
}

export const createProjectDefaultColumns = async (projectId: ObjectId | string, createdBy: ObjectId | string): Promise<boolean> => {
  const projectColsData = defaultColumns.map((cn, idx) => ({
    projectId,
    name: cn,
    createdBy,
    idx
  }))
  return await createColumns(projectColsData)
}

export const updateColumn = async (_id: ObjectId | string, data: any): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const { name, sequence } = sanitize(data)
  if (name == null && sequence == null) return false
  const set: any = {}
  if (name != null) set.name = name
  if (sequence != null) set.sequence = sequence
  const res = await db
    .collection(TABLE_NAME)
    .updateOne({ _id }, { $set: set })
  return res.result.ok === 1
}

export const deleteColumnAndCards = async (_id: ObjectId | string): Promise<boolean> => {
  await deleteCards({ columnId: _id })
  return await deleteColumn(_id)
}

export const deleteColumn = async (_id: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const res = await db
    .collection(TABLE_NAME)
    .deleteOne({ _id })
  return res.result.ok === 1
}

export const deleteColumns = async (where: any): Promise<boolean> => {
  const { db } = await connectToDatabase()
  where = sanitize(where)
  if (where._id != null) where._id = toObjectId(where._id)
  if (where.projectId != null) where.projectId = toObjectId(where.projectId)
  const res = await db
    .collection(TABLE_NAME)
    .deleteMany(where)
  return res.result.ok === 1
}

export const deleteProjectColumns = async (projectId: ObjectId | string): Promise<boolean> => {
  if (isEmpty(projectId)) return false
  return await deleteColumns({ projectId })
}

export const getColumnsByProjectId = async (projectId: ObjectId | string): Promise<any[]> => {
  return await getColumns({ projectId })
}

export const getTodoColumn = async (projectId: ObjectId | string): Promise<any> => {
  return await getColumn({ projectId, name: ColumnName.TODO })
}

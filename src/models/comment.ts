import { connectToDatabase, toObjectId } from './mongodb'
import { ObjectId } from 'mongodb'
import { sanitize } from '@/src/models/mongodb'
import { Comment as CommentTypeDef } from '@/src/types/comment'
import Activity from '@/src/models/activity'
import Model, { generatePaginationQuery } from '@/src/models/model'
import { JobMentionNotification } from '@/src/models/job/job-mention-notification'

export const TABLE_NAME = 'comments'

export const formatWhere = (where: string | ObjectId | any): any => {
  where = { ...where }
  where = sanitize(where)
  if (where instanceof ObjectId || typeof where === 'string') {
    where = { _id: toObjectId(where) }
  } else if (where != null) {
    ['_id', 'cardId', 'projectId', 'userId', 'userIds'].forEach(key => {
      if (where[key] != null) where[key] = Array.isArray(where[key]) ? where[key].map(toObjectId) : toObjectId(where[key])
    })
  }
  return where
}

export const getComment = async (where: string | ObjectId | any): Promise<CommentTypeDef> => {
  const formattedWhere = formatWhere(where)
  const { db } = await connectToDatabase()
  return await db.collection(TABLE_NAME).findOne(formattedWhere)
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Comment extends Model {
  static TABLE_NAME = TABLE_NAME

  static getUserIdsFromMentions (comment: CommentTypeDef): ObjectId[] {
    /*
    * (?<=@\[[^\]]+\]\() - Lookbehind for @ followed by [any character except ]] followed by (. This is the start of the mention
    * [^)]+ - Any character except ) one or more times
    * (?=\)) - Lookahead for ). This is the end of the mention
    */
    return comment?.text?.match(/(?<=@\[[^\]]+\]\()[^)]+(?=\))/g)?.map(toObjectId) ?? []
  }

  static async find (where: any, limit: number = 10000, sort: [field: string, order: number] = ['_id', 1], page?: string): Promise<{ count: number, limit: number, data: any[], page: string }> {
    const { db } = await connectToDatabase()
    where = sanitizeData(where)
    const { wherePagined, nextKeyFn } = generatePaginationQuery(where, sort, page)
    const pipeline = [
      { $match: wherePagined },
      { $sort: { [sort[0]]: sort[1] } },
      { $limit: limit },
      {
        $lookup: {
          from: 'comments',
          localField: 'parentId',
          foreignField: '_id',
          as: 'parent'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'user.password': 0,
          'user.avatar': 0,
          'users.password': 0,
          'users.avatar': 0
        }
      }
    ]
    const res = await db
      .collection(this.TABLE_NAME)
      .aggregate(pipeline)
    const count = await db
      .collection(this.TABLE_NAME)
      .find(where)
      .sort([sort])
      .count()

    const data = await res.toArray()
    return {
      count,
      limit,
      page: nextKeyFn(data),
      data: await res.toArray()
    }
  }
}

export const sanitizeData = (data: any): any => {
  data = sanitize(data)
  if (data._id != null) data._id = toObjectId(data._id)
  if (data.projectId != null) data.projectId = toObjectId(data.projectId)
  if (data.cardId != null) data.cardId = toObjectId(data.cardId)
  if (data.userId != null) data.userId = toObjectId(data.userId)
  if (data.parentId != null) data.parentId = toObjectId(data.parentId)
  if (data.userIds != null) data.userIds = data.userIds.map(toObjectId)
  return data
}

export const getComments = async (where: any): Promise<CommentTypeDef[]> => {
  const { db } = await connectToDatabase()
  where = sanitizeData(where)
  return await db.collection(TABLE_NAME).find(where).toArray()
}

export const createCommentAndActivity = async (data: Partial<CommentTypeDef>): Promise<CommentTypeDef | null> => {
  const comment = await createComment(data)
  if (comment != null) void Activity.createCommentCreateActivity(comment)
  return comment
}

export const createComment = async (data: Partial<CommentTypeDef>): Promise<CommentTypeDef | null> => {
  const { db } = await connectToDatabase()
  data = sanitizeData(data)
  data.createdAt = new Date()
  let localData: any = {}
  const anyData = data as any;
  ['projectId', 'userId', 'text', 'cardId', 'createdAt', 'questionId', 'parentId'].forEach(k => {
    if (anyData[k] != null) localData[k] = anyData[k]
  })
  localData = sanitize(localData)
  localData.userIds = Comment.getUserIdsFromMentions(localData)
  const result = await db.collection(TABLE_NAME).insertOne(localData)
  if (result.result.ok === 1) {
    const comment = await db.collection(TABLE_NAME).findOne({ _id: result.insertedId })
    void JobMentionNotification.createMentionNotificationJob(comment)
    return comment
  }
  return null
}

export const updateCommentAndCreateActivity = async (_id: ObjectId | string, data: Partial<CommentTypeDef>): Promise<boolean> => {
  const updated = await updateComment(_id, data)
  if (updated) void Activity.createCommentUpdateActivity(_id)
  return updated
}

export const updateComment = async (_id: ObjectId | string, data: Partial<CommentTypeDef>): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const { text } = data
  const keys = Object.keys(data)
  const localData: any = sanitize({ text })
  if (keys.includes('parentId') && data.parentId == null) localData.parentId = null
  localData.updatedAt = new Date()
  localData.userIds = Comment.getUserIdsFromMentions(localData)
  const res = await db
    .collection(TABLE_NAME)
    .updateOne({ _id }, { $set: localData })
  void JobMentionNotification.createMentionNotificationJob(_id)
  return res.result.ok === 1
}

export const deleteCommentAndCreateActivity = async (_id: ObjectId | string, userId: string | ObjectId): Promise<boolean> => {
  const deleted = await deleteComment(_id, userId)
  if (deleted) void Activity.createCommentDeleteActivity(_id, userId)
  return deleted
}

export const deleteComment = async (_id: ObjectId | string, deleteBy?: string | ObjectId): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const set: Partial<CommentTypeDef> = { deletedAt: new Date(), text: undefined, userIds: [] }
  if (deleteBy != null) set.deletedBy = toObjectId(deleteBy)
  const res = await db
    .collection(TABLE_NAME)
    .updateOne({ _id }, { $set: set })
  return res.result.ok === 1
}

export const deleteComments = async (where: any): Promise<boolean> => {
  const { db } = await connectToDatabase()
  where = sanitize(where)
  if (where._id != null) where._id = Array.isArray(where._id) ? where._id.map(toObjectId) : toObjectId(where._id)
  if (where.projectId != null) where.projectId = toObjectId(where.projectId)
  const res = await db
    .collection(TABLE_NAME)
    .deleteMany(where)
  return res.result.ok === 1
}

export default Comment

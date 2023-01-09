import { ObjectId } from 'mongodb'
import { connectToDatabase, toObjectId } from './mongodb'
import sanitize from 'mongo-sanitize'
// import { isEmpty } from '@/util/index'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default abstract class Model {
  static TABLE_NAME = 'TODO'

  static async create (data: any): Promise<string | null> {
    const { db } = await connectToDatabase()
    data = {
      _id: new ObjectId(),
      ...data
    }
    data = sanitize(data)
    const res = await db
      .collection(this.TABLE_NAME)
      .insertOne(data)

    return res.result.ok === 1 ? String(data._id) : null
  }

  static async get<Type> (_id: string | ObjectId): Promise<Type> {
    const { db } = await connectToDatabase()
    const where: any = {
      _id: toObjectId(_id)
    }
    const card = await db
      .collection(this.TABLE_NAME)
      .findOne(where)
    return card
  }

  static async find<Type> (where: any, limit: number = 500, sort: [field: string, order: number] = ['_id', 1], page?: string): Promise<{ count: number, limit: number, data: Type[], page: string }> {
    const { db } = await connectToDatabase()
    where = sanitize(where)
    if (where._id != null) where._id = toObjectId(where._id)
    const { wherePagined, nextKeyFn } = generatePaginationQuery(where, sort, page)
    const res = await db
      .collection(this.TABLE_NAME)
      .find(wherePagined)
      .limit(limit)
      .sort([sort])
    const count = await db
      .collection(this.TABLE_NAME)
      .find(wherePagined)
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

export function generatePaginationQuery (where: any, sort: any[], nextKey?: any): { wherePagined: any, nextKeyFn: Function } {
  const sortField = sort == null ? null : sort[0]

  function nextKeyFn (items: any[]): string | null {
    if (items?.length === 0) {
      return null
    }

    const lastItem = items[items.length - 1]

    let nextK = { _id: lastItem._id, [sortField]: lastItem[sortField] }
    if (sortField == null || sortField === '_id') {
      nextK = { _id: lastItem._id }
    }

    return Buffer.from(JSON.stringify(nextK)).toString('base64')
  }

  if (nextKey == null) {
    return { wherePagined: where, nextKeyFn }
  }

  nextKey = JSON.parse(Buffer.from(nextKey, 'base64').toString('utf-8'))

  let wherePagined = where

  if (sort == null) {
    wherePagined._id = { $gt: nextKey._id }
    return { wherePagined, nextKeyFn }
  }

  const sortOperator = sort[1] === 1 ? '$gt' : '$lt'

  const paginationQuery = [
    { [sortField]: { [sortOperator]: nextKey[sortField] } },
    {
      $and: [
        { [sortField]: nextKey[sortField] },
        { _id: { [sortOperator]: nextKey._id } }
      ]
    }
  ]

  if (wherePagined.$or == null) {
    wherePagined.$or = paginationQuery
  } else {
    wherePagined = { $and: [where, { $or: paginationQuery }] }
  }

  return { wherePagined, nextKeyFn }
}

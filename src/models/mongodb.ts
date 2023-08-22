import {
  // Logger,
  Db, MongoClient, ObjectId
} from 'mongodb'
import { isEmpty } from '@/util/index'

const { MONGODB_URI, MONGODB_DB } = process.env

if (isEmpty(MONGODB_URI)) {
  throw new Error('Please define the MONGODB_URI environment variable inside the .env files')
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = {} as any

if (cached == null) {
  cached = { conn: null, promise: null, uri: null }
}

export async function isConnected (client: MongoClient): Promise<boolean> {
  if (client instanceof MongoClient) {
    let res = null
    try {
      res = await client.db().admin().ping()
    } catch (e: any) {
      res = null
    }
    return res?.ok === 1
  }
  return false
}

export async function connectToDatabase (mongoDbUri?: string, dbName?: string | null): Promise<{ client: MongoClient, db: Db }> {
  if (cached.conn?.client instanceof MongoClient) {
    let res = null
    try {
      res = await cached.conn.client.db().admin().ping()
    } catch (e: any) {
      res = null
    }
    if (res?.ok === 1 && ((mongoDbUri != null && cached.conn.uri === mongoDbUri) || mongoDbUri == null)) return cached.conn
    else {
      await cached.conn.client.close()
      cached = { conn: null, promise: null, uri: null }
    }
  }
  mongoDbUri = mongoDbUri ?? String(MONGODB_URI)
  dbName = dbName ?? (MONGODB_DB != null ? String(MONGODB_DB) : null)

  if (cached.promise == null) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }

    cached.promise = MongoClient.connect(mongoDbUri, opts).then(client => {
      const db = typeof dbName === 'string' && dbName.length > 0 ? client.db(dbName) : client.db()
      return {
        client,
        db,
        uri: mongoDbUri
      }
    })
  }
  // Logger.setLevel('debug')
  cached.conn = await cached.promise
  return cached.conn
}

const REGEX_TO_MATCH = /(^\$.)|((.+)?\.\$.)/

export function sanitize (v: any): any {
  if (v instanceof ObjectId) return v
  if (v instanceof Object) {
    for (const key in v) {
      if (REGEX_TO_MATCH.test(key)) {
        const val = v[key]
        const newKey = key.replace(/^\$/gm, '').replace(/\.\$/gm, '.')
        v[newKey] = sanitize(val)
        delete v[key] // eslint-disable-line @typescript-eslint/no-dynamic-delete
      } else {
        v[key] = sanitize(v[key])
      }
    }
  }
  return v
}

export const toObjectId = (_id: string | ObjectId): ObjectId => typeof _id === 'string' ? ObjectId(sanitize(_id)) : _id

export const cleanEmail = (email: string): string => sanitize(email.trim().toLowerCase())
export const cleanText = (txt: string): string => sanitize(txt.trim())

export const addToWhere = (where: any, key: string, value: any, operator: string = '$eq'): void => {
  if (typeof where[key] === 'object') {
    if (where[key][operator] == null) where[key][operator] = value
    else {
      where.$and = where.$and ?? []
      where.$and.push({ [key]: { [operator]: value } }, { [key]: where[key] })
    }
  } else if (typeof where[key] === 'string' || where[key] instanceof ObjectId) {
    where[key] = { [operator]: value, $eq: where[key] }
  } else {
    where[key] = { operator: value }
  }
}

const operators = ['in', '$gt', '$gte', 'lt', 'lte', 'ne', 'nin', 'eq', 'exists']

export function urlQueryToDBqueryParser (query: any, defaultLimit = 100, defaultSort = { _id: -1 }, objectIdProps: string[] = []): any {
  let sort: any = {}
  let limit = defaultLimit
  let page = null
  const where: any = {}
  const keys = Object.keys(query)
  for (const k of keys) {
    let value = query[k]
    if (k === 'limit') {
      limit = `${+value}` === `${String(value)}` ? +value : limit
      limit = Math.min(limit, defaultLimit)
    } else if (k === 'sort') {
      const strArr: string[] = Array.isArray(value) ? value : value.split(',')
      for (const v of strArr) {
        let order = 1
        let field = v
        if (v.startsWith('-')) {
          order = -1
          field = v.replace(/^-/, '')
        }
        field = sanitize(field)
        sort[field] = order
      }
    } else if (k === 'page') {
      page = value
    } else {
      const sanitizedKey = sanitize(k)
      const isObjectIdProp = objectIdProps.includes(sanitizedKey)
      if (typeof value === 'string') {
        value = value.split(',')
      }
      if (Array.isArray(value)) {
        value = value.map(v => sanitize(v))
        if (isObjectIdProp) value = mapToObjectIds(value)
        if (value.length === 0) continue
        if (value.length === 1) where[sanitizedKey] = value[0]
        else where[sanitizedKey] = { $in: value }
      } else if (typeof value === 'object') {
        const andQ: any = {}
        for (const op in value) {
          if (!operators.includes(op)) continue
          const opMongo = `$${op}`
          let opVal = value[op].split(',').map((v: string) => sanitize(v))
          if (isObjectIdProp) opVal = mapToObjectIds(opVal)
          if (opVal.length === 1) opVal = opVal[0]
          andQ[opMongo] = opVal
        }
        where[sanitizedKey] = andQ
      }
    }
  }
  if (isEmpty(sort)) sort = defaultSort
  return { where, sort, limit, page }
}

const mapToObjectIds = (arr: any[]): any[] => arr
  .map((v: any) => String(v).length === 24 ? v : null)
  .filter((v: any) => v != null)
  .map((v: any) => toObjectId(v))


import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { connectToDatabase, isConnected as dbIsConnected } from '@/src/models/mongodb'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getProjectUsers } from '@/src/models/project'
import { getUser } from '@/src/models/user'
import { getCard } from '@/src/models/card'
import { User } from '@/src/types/user'

const API_KEY = process.env.API_KEY

const returnUnauthorized = (res: NextApiResponse): void => {
  res.status(401).send({ message: 'Unauthorized', status: 401, code: 9010 })
}

export function hasApiKey (handler: any): Function {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
    const { 'x-api-key': apiKey } = req.headers
    if (apiKey !== API_KEY) return returnUnauthorized(res)
    return handler(req, res)
  }
}

export function isConnected (handler: any): Function {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
    const session = await getServerSession(req, res, authOptions)
    const { client } = await connectToDatabase()

    if (session?.user == null) {
      return returnUnauthorized(res)
    }
    if (!(await dbIsConnected(client))) {
      return res.status(500).send({ message: 'DB connection error', status: 500, code: 9004 })
    }
    return addUserToReq(handler)(req, res)
  }
}

export function isCurrentUser (handler: Function): Function {
  return addUserToReq(async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
    const { userId } = req.query
    const user = getUserFromRequest(req)
    if (user?._id?.toString() !== userId) return res.status(403).send({ message: 'forbidden', code: 9003 })
    return handler(req, res)
  })
}

export function addUserToReq (handler: Function): Function {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
    let user = getUserFromRequest(req)
    if (user != null) return handler(req, res)
    const session = await getServerSession(req, res, authOptions)
    if (session?.user == null) {
      return returnUnauthorized(res)
    }
    user = await getUser({ _id: String(session?.user?.name) })
    if (user == null) {
      return returnUnauthorized(res)
    }
    const tempReq = req as any
    tempReq.locals = tempReq.locals ?? {}
    tempReq.locals.user = user
    return handler(req, res)
  }
}

export function hasProjectAccess (handler: Function): Function {
  return addUserToReq(async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
    let hasAccess = false
    const user = getUserFromRequest(req)
    let { projectId } = req.query
    if (projectId == null) {
      projectId = req.body?.projectId
    }
    if (projectId != null && projectId !== 'undefined' && user?._id != null) {
      const users = await getProjectUsers(String(projectId), [user._id])
      hasAccess = users.some(u => String(u._id) === String(user._id))
    }
    if (!hasAccess) {
      return res.status(403).send({ message: 'Forbidden', status: 403, code: 9003 })
    }
    return handler(req, res)
  })
}

export function cardBelongsToProject (handler: Function): Function {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
    const { projectId, cardId } = req.query
    const card = await getCard(String(cardId))
    if (card == null) {
      return res.status(404).send({ message: 'Notfound', status: 404, code: 9006 })
    }
    if (String(card.projectId) !== String(projectId)) {
      return res.status(400).send({ message: 'Bad Request', status: 400, code: 9002 })
    }
    return handler(req, res)
  }
}

export function getUserFromRequest (req: NextApiRequest): User | null {
  const tempReq = req as any
  return tempReq.locals?.user
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { hasProjectAccess, isConnected, getUserFromRequest } from '@/util/custom-middleware'
import { addUserToCardAndCreateActivity, removeUserFromCardAndCreateActivity } from '@/src/models/card'
import { getProjectUsers } from '@/src/models/project'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { projectId, cardId, userId } = req.query
  const creator = getUserFromRequest(req)
  projectId = String(projectId)
  cardId = String(cardId)
  userId = String(userId)

  switch (req.method) {
    case 'POST': {
      const users = await getProjectUsers(projectId, [userId])
      const user = users?.find(u => String(u._id) === userId) ?? null
      if (user == null) return res.status(400).send({ message: 'invalid user', code: 9006 })
      // const res =
      if (creator == null) return res.status(401).send({ message: 'unauthorized', code: 9010 })
      await addUserToCardAndCreateActivity(cardId, creator._id as string, userId)
      return res.send(201)
    }
    case 'DELETE': {
      if (creator == null) return res.status(401).send({ message: 'unauthorized', code: 9010 })
      await removeUserFromCardAndCreateActivity(cardId, creator._id as string, userId)
      return res.send(201)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(handler))

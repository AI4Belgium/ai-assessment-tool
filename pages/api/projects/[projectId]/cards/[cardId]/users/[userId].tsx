import type { NextApiRequest, NextApiResponse } from 'next'
import { hasProjectAccess, isConnected, getUserFromRequest } from '@/util/temp-middleware'
import { addUserToCardAndCreateActivity, removeUserFromCardAndCreateActivity } from '@/src/models/card'
import { getProjectUsers } from '@/src/models/project'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { projectId, cardId, userId } = req.query

  switch (req.method) {
    case 'POST': {
      const users = await getProjectUsers(projectId, [userId])
      const user = users?.find(u => String(u._id) === userId) ?? null
      if (user == null) return res.status(400).send({ message: 'invalid user' })
      // const res =
      const creator = getUserFromRequest(req)
      if (creator == null) return res.status(404).send({ message: 'unauthorized' })
      await addUserToCardAndCreateActivity(cardId, creator._id as string, userId as string)
      return res.send(201)
    }
    case 'DELETE': {
      const creator = getUserFromRequest(req)
      if (creator == null) return res.status(404).send({ message: 'unauthorized' })
      await removeUserFromCardAndCreateActivity(cardId, creator._id as string, userId as string)
      return res.send(201)
    }
    default:
      return res.status(400).send({ message: 'Invalid request' })
  }
}

export default isConnected(hasProjectAccess(handler))

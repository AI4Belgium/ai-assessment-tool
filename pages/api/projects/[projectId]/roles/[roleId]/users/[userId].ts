import type { NextApiRequest, NextApiResponse } from 'next'
import { addUserToRoleAndCreateActivity, removeUserFromRoleAndCreateActivity } from '@/src/models/role'
import { isConnected, hasProjectAccess, getUserFromRequest } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { projectId, roleId, userId } = req.query
  const user = getUserFromRequest(req)
  projectId = String(projectId)
  roleId = String(roleId)
  userId = String(userId)

  if (user?._id == null) return res.status(403).send({ code: 9003 })

  switch (req.method) {
    case 'POST': {
      await addUserToRoleAndCreateActivity(projectId, roleId, user?._id, userId)
      return res.send(201)
    }
    case 'DELETE': {
      await removeUserFromRoleAndCreateActivity(projectId, roleId, user?._id, userId)
      return res.send(201)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(handler))

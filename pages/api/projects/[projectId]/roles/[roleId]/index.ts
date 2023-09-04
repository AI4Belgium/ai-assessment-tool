import type { NextApiRequest, NextApiResponse } from 'next'
import { getRole, removeRoleAndCreateActivity, updateRoleAndCreateActivity } from '@/src/models/role'
import { isConnected, hasProjectAccess, getUserFromRequest } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { projectId, roleId } = req.query
  const user = getUserFromRequest(req)
  projectId = String(projectId)
  roleId = String(roleId)

  switch (req.method) {
    case 'PATCH': {
      const { name, desc } = req.body
      await updateRoleAndCreateActivity(projectId, String(user?._id), { _id: String(roleId), name, desc })
      const role = await getRole(projectId, roleId)
      return res.status(200).json(role)
    }
    case 'DELETE': {
      const success = await removeRoleAndCreateActivity(projectId, roleId, String(user?._id))
      return success ? res.send(201) : res.send(400)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(handler))

import type { NextApiRequest, NextApiResponse } from 'next'
import { addRoleAndCreateActivity } from '@/src/models/role'
import { isConnected, hasProjectAccess, getUserFromRequest } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { projectId } = req.query
  const user = getUserFromRequest(req)
  projectId = String(projectId)

  switch (req.method) {
    case 'POST': {
      const { name, desc } = req.body
      const role = await addRoleAndCreateActivity(projectId, { name, desc }, String(user?._id))
      return res.status(200).json(role)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(handler))

import type { NextApiRequest, NextApiResponse } from 'next'
import { getInactiveProjectUsers, getProjectUsers } from '@/src/models/project'
import { isConnected, hasProjectAccess } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { projectId } = req.query
  projectId = String(projectId)

  switch (req.method) {
    case 'GET': {
      const activeUsers = await getProjectUsers(projectId)
      const inactiveUsers = await getInactiveProjectUsers(projectId)
      return res.status(200).json({ activeUsers, inactiveUsers })
    }
    default:
      return res.status(404).send({ message: 'Not found', code: 9006 })
  }
}

export default isConnected(hasProjectAccess(handler))

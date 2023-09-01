import type { NextApiRequest, NextApiResponse } from 'next'
import { isConnected, getUserFromRequest } from '@/util/custom-middleware'
import Activity from '@/src/models/activity'
import { getUserProjects } from '@/src/models/project'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const user = getUserFromRequest(req)

  switch (req.method) {
    case 'GET': {
      const { page } = req.query
      if (user?._id == null) return res.status(403).send({ code: 9003 })
      const projects = await getUserProjects(user._id)
      if (projects == null || projects.length === 0) return res.status(200).send([])

      const result = await Activity.find({ projectId: { $in: projects.map(p => p._id) } }, 100, ['_id', -1], page != null ? String(page) : undefined)
      if (result == null) return res.status(200).send([])

      const returnData = {
        data: result.data,
        total: result.count,
        page: result.page,
        limit: result.limit
      }
      return res.status(200).send(returnData)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(handler)

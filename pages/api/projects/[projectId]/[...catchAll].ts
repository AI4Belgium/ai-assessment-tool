import type { NextApiRequest, NextApiResponse } from 'next'
import { sanitize } from '@/src/models/mongodb'
import { TokenStatus, getProjectInvites, deleteToken } from '@/src/models/token'
import { isConnected, hasProjectAccess } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { projectId, catchAll } = req.query

  if (projectId instanceof Array) projectId = projectId[0]
  if (projectId == null) return res.status(400).send({ code: 9000 })

  let restOfQuery = catchAll != null && typeof catchAll === 'string' ? [catchAll] : []

  if (Array.isArray(catchAll)) {
    restOfQuery = catchAll.map(sanitize)
  }

  switch (req.method) {
    case 'GET': {
      const [tokens, tokenStatus = ''] = restOfQuery
      if (tokens.toLowerCase() === 'tokens' && tokenStatus.toUpperCase() === TokenStatus.PENDING) {
        const tokenInstances = await getProjectInvites(projectId)
        return res.status(200).json(tokenInstances)
      }
      return res.status(404).json([])
    }
    case 'DELETE': {
      const [tokens, tokenId] = restOfQuery
      if (tokens.toLowerCase() === 'tokens' && tokenId?.length === 24) {
        const deleted = await deleteToken(tokenId)
        return res.status(200).json({ success: deleted })
      }
      return res.status(404).json([])
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(handler))

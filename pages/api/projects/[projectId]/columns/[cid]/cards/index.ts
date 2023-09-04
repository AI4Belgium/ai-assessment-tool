import type { NextApiRequest, NextApiResponse } from 'next'
import { hasProjectAccess, isConnected } from '@/util/custom-middleware'
import { getCards } from '@/src/models/card'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { projectId, cid } = req.query

  switch (req.method) {
    case 'GET': {
      const cards = await getCards({ projectId: String(projectId), columnId: cid as string })
      return res.send(cards)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(handler))

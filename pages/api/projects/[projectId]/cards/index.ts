import type { NextApiRequest, NextApiResponse } from 'next'
import { getCards } from '@/src/models/card'
import { isConnected, hasProjectAccess } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { projectId } = req.query
  projectId = String(projectId)

  switch (req.method) {
    case 'GET': {
      const cards = await getCards({ projectId })
      return res.send(cards)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(handler))

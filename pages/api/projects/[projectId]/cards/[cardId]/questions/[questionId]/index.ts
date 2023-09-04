import type { NextApiRequest, NextApiResponse } from 'next'
import { cardBelongsToProject, hasProjectAccess, isConnected, getUserFromRequest } from '@/util/custom-middleware'
import { updateQuestionAndCreateActivity } from '@/src/models/card'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { cardId, questionId } = req.query

  switch (req.method) {
    case 'PATCH': {
      const user = getUserFromRequest(req)
      const result = await updateQuestionAndCreateActivity(String(cardId), String(user?._id), questionId as string, req.body)
      return result ? res.send(201) : res.status(400).send({ message: 'could not update question', code: 9007 })
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(cardBelongsToProject(handler)))

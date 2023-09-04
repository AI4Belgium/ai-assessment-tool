import type { NextApiRequest, NextApiResponse } from 'next'
import { hasProjectAccess, isConnected, cardBelongsToProject } from '@/util/custom-middleware'
import Comment, { createCommentAndActivity } from '@/src/models/comment'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { projectId, cardId, questionId } = req.query

  const reqAsAny = req as any
  const user = reqAsAny.locals.user

  switch (req.method) {
    case 'POST': {
      const comment = await createCommentAndActivity({ ...req.body, projectId, questionId, cardId, userId: user._id })
      return comment != null ? res.status(201).send(comment) : res.status(400).send({ code: 9009 })
    }
    case 'GET': {
      const result = await Comment.find({ projectId, cardId })
      const comments = result.data
      return res.status(200).send(comments)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(cardBelongsToProject(handler)))

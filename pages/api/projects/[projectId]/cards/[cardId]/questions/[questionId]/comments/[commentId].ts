import type { NextApiRequest, NextApiResponse } from 'next'
import { cardBelongsToProject, hasProjectAccess, isConnected } from '@/util/custom-middleware'
import { deleteCommentAndCreateActivity, getComment, updateCommentAndCreateActivity } from '@/src/models/comment'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { projectId, commentId } = req.query
  projectId = String(projectId)
  commentId = String(commentId)
  const reqAsAny = req as any
  const user = reqAsAny.locals.user

  const comment = await getComment({ _id: commentId })
  if (comment == null) return res.status(404).send({ message: 'not found', code: 9006 })
  if (String(comment.userId) !== String(user._id)) return res.status(403).send({ message: 'forbidden', code: 9003 })

  switch (req.method) {
    case 'GET': {
      const comment = await getComment({ projectId, _id: commentId })
      return res.status(200).send(comment)
    }
    case 'PATCH': {
      const result = await updateCommentAndCreateActivity(commentId, { ...req.body })
      const comment = await getComment({ _id: commentId })
      return result ? res.status(200).send(comment) : res.status(400).send({ message: 'could not update', code: 9007 })
    }
    case 'DELETE': {
      const result = await deleteCommentAndCreateActivity(commentId, user._id)
      const comment = await getComment({ projectId, _id: commentId })
      return result ? res.status(200).send(comment) : res.status(400).send({ message: 'could not delete', code: 9008 })
    }
    default:
      res.status(400).send({ message: 'Invalid request', code: 9002 })
      break
  }
}

export default isConnected(hasProjectAccess(cardBelongsToProject(handler)))

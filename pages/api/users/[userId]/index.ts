import type { NextApiRequest, NextApiResponse } from 'next'
import { getUser, updateUser } from '@/src/models/user'
import { isConnected } from '@/util/custom-middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getUserProjects } from '@/src/models/project'
import isEmpty from 'lodash.isempty'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const session = await getServerSession(req, res, authOptions)
  let { userId } = req.query
  userId = String(userId)
  let user: any = await getUser({ _id: String(session?.user?.name) })
  switch (req.method) {
    case 'GET': {
      if (userId !== 'me') {
        const projects = await getUserProjects(user._id)
        const userIds = projects.map((project) => project.userIds).flat().map(uid => String(uid))
        if (!userIds.includes(String(userId))) return res.status(403).json({ error: 'You are not authorized to view this user', code: 9003 })
        user = await getUser({ _id: userId })
      }
      return res.status(200).json(user)
    }
    case 'PATCH': {
      if (String(user._id) !== userId) return res.status(403).json({ message: 'You are not authorized to update this user', code: 9003 })
      if (isEmpty(req.body)) res.status(204).end()
      const data = req.body
      delete data.email
      // const updated =
      await updateUser(userId, data)
      return res.status(204).end()
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(handler)

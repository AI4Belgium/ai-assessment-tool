import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { cleanEmail, toObjectId } from '@/src/models/mongodb'
import { inviteUser } from '@/src/models/token'
import { getUser } from '@/src/models/user'
import { authOptions } from './auth/[...nextauth]'
import { isEmailValid } from '@/util/validator'
import { sendMail } from '@/util/mail'
import templates from '@/util/mail/templates'
import { isConnected, hasProjectAccess } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const session = await getServerSession(req, res, authOptions)

  switch (req.method) {
    case 'POST': {
      let { email, projectId } = req.body
      if (email == null || projectId == null || !isEmailValid(email)) return res.status(400).json({ message: 'missing properties' })
      email = email != null ? cleanEmail(email) : email
      projectId = projectId != null ? toObjectId(projectId) : projectId
      const creator = await getUser({ email: String(session?.user?.email) })
      if (creator?._id == null) return res.status(400).json({ message: 'missing properties' })
      let tokenInstance
      try {
        tokenInstance = await inviteUser(projectId, email, creator?._id)
      } catch (error) {
        return res.status(400).json({ message: (error as any)?.message ?? 'Something went wrong' })
      }
      const user = await getUser({ email })
      const page = user != null ? 'login' : 'signup'
      const html = templates.getInvitationHtml(page, tokenInstance.token, email, projectId)
      await sendMail(email, 'Invitation to AI4Belgium', html)
      return res.status(200).send(null)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(hasProjectAccess(handler))

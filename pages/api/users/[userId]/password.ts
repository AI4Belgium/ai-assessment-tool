import type { NextApiRequest, NextApiResponse } from 'next'
import { updatePassword } from '@/src/models/user'
import { isConnected, isCurrentUser } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  let { userId } = req.query
  userId = String(userId)

  switch (req.method) {
    case 'PATCH': {
      const data = {
        _id: userId,
        password: req.body.newPassword,
        currentPassword: req.body.currentPassword
      }
      try {
        const successful = await updatePassword(data)
        if (!successful) throw new Error('something went wrong')
        return res.status(204).end()
      } catch (error: any) {
        const responseObj: any = { message: error?.message ?? 'something went wrong', code: 9004 }
        if (error?.code != null) responseObj.code = error.code
        return res.status(400).send(responseObj)
      }
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isCurrentUser(isConnected(handler))

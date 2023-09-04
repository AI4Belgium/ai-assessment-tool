import type { NextApiRequest, NextApiResponse } from 'next'
import { upsertNotificationSetting, getNotificationSetting } from '@/src/models/notification-setting'
import { isConnected } from '@/util/custom-middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getUser } from '@/src/models/user'
import { NotificationSetting } from '@/src/types/notification-setting'
import { ObjectId } from 'mongodb'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const session = await getServerSession(req, res, authOptions)
  const user: any = await getUser({ _id: String(session?.user?.name) })

  switch (req.method) {
    case 'GET': {
      const notification = await getNotificationSetting(user._id)
      return res.status(200).json(notification)
    }
    case 'PATCH': {
      const data: NotificationSetting = {
        _id: new ObjectId(user._id).toString(),
        mentions: req.body.mentions,
        projectActivity: req.body.projectActivity
      }
      try {
        await upsertNotificationSetting(data)
        return res.status(204).end()
      } catch (error: any) {
        return res.status(400).send({ message: error?.message ?? 'something went wrong' })
      }
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(handler)

import type { NextApiRequest, NextApiResponse } from 'next'
import { hasApiKey } from '@/util/custom-middleware'
import { JobDeleteUserData } from '@/src/models/job/job-delete-user-data'
import { JobDeleteNotification } from '@/src/models/job/job-delete-notification'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  switch (req.method) {
    case 'POST': {
      try {
        const { AUTO_DELETE_ACCOUNT = false } = process.env
        if (['true', true, 1, '1'].includes(AUTO_DELETE_ACCOUNT)) {
          void JobDeleteNotification.createDeleteNotificationIfNotExistingJobs()
          void JobDeleteUserData.createJobsIfNotExisting()
        }
        res.status(204).end()
      } catch (error) {
        res.status(400).send({ message: (error as any).message })
      }
      break
    }
    default:
      res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default hasApiKey(handler)

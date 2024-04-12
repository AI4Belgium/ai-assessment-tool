import type { NextApiRequest, NextApiResponse } from 'next'
import { hasApiKey } from '@/util/custom-middleware'
import { JobProjectActivityNotification } from '@/src/models/job/job-project-activity-notification'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  switch (req.method) {
    case 'POST': {
      try {
        await JobProjectActivityNotification.createProjectActivityNotificationJobs()
        res.status(204).end()
      } catch (error) {
        res.status(400).send({ message: (error as any)?.message })
      }
      break
    }
    default:
      res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default hasApiKey(handler)

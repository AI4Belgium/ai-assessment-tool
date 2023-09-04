import type { NextApiRequest, NextApiResponse } from 'next'
import { isConnected, getUserFromRequest } from '@/util/custom-middleware'
import { getUserProjects } from '@/src/models/project'
import Activity from '@/src/models/activity'
import isEmpty from 'lodash.isempty'

const notAllowedMsg = 'You are not allowed to update this activity'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const user = getUserFromRequest(req)
  const { activityId } = req.query

  switch (req.method) {
    case 'POST': {
      const activity = await Activity.get(activityId as string)
      if (activity == null) return res.status(404).send({ message: 'Activity not found' })
      if (user?._id != null) {
        const projects = await getUserProjects(user._id, activity.projectId)
        if (isEmpty(projects)) return res.status(403).send({ message: notAllowedMsg })
        await Activity.addUserToSeenBy(activityId as string, String(user._id))
        return res.status(204).end()
      } else {
        return res.status(403).send({ message: notAllowedMsg })
      }
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(handler)

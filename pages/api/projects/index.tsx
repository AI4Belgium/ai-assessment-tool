import type { NextApiRequest, NextApiResponse } from 'next'
import { createProjectWithDefaultColumnsAndCardsAndActivity, getProject, getUserProjects } from '@/src/models/project'
import { dataToCards } from '@/src/models/card'
import { defaultCards, defaultRoles } from '@/src/data'
import { addRoles } from '@/src/models/role'
import { isConnected } from '@/util/custom-middleware'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const anyReq = req as any
  const user = anyReq.locals.user
  switch (req.method) {
    case 'POST': {
      const { name, description, industryId } = req.body
      const cardsData = await dataToCards(defaultCards)
      const projectId = await createProjectWithDefaultColumnsAndCardsAndActivity(
        { name, description, industryId, createdBy: user?._id },
        cardsData,
        user?._id
      )
      await addRoles(projectId, defaultRoles)
      const project = await getProject(projectId)
      return res.send(project)
    }
    case 'GET': {
      const projects = await getUserProjects(user?._id)
      return res.send(projects)
    }
    default:
      return res.status(400).send({ message: 'Invalid request', code: 9002 })
  }
}

export default isConnected(handler)

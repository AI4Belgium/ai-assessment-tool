/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[projectId]'
import { givenAProject, givenAUser, givenAnAuthenticationToken, givenMultipleProjects, givenProjectData, setupMongoDB } from '@/util/test-utils'
import { User } from '@/src/types/user'
import { Project } from '@/src/types/project'
import { getProject } from '@/src/models/project'

const PATH = '/api/projects/[projectId]'
// nextjs req will automatically parse the params from the url and add them to the query object but this is not done by node-mocks-http
const getUrl = (projectId: string): string => `http://localhost:3000/api/projects/${projectId}?projectId=${projectId}`

describe(PATH, () => {
  setupMongoDB()

  describe('GET', () => {
    it('a user can get a project', async () => {
      const user = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      const projects = await givenMultipleProjects(5, {}, user)
      // const notUsersProjects =
      await givenMultipleProjects(5, {}, undefined) // create some other projects belonging to other users
      const [project] = projects
      const { req, res } = createMocks({
        method: 'GET',
        url: getUrl(project._id),
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        }
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
      const projectReturned = res._getData() as Project
      expect(String(projectReturned._id)).toEqual(String(project._id))
    })

    it('a user cannot get a project he does not belong to', async () => {
      const user = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      // const projects =
      await givenMultipleProjects(5, {}, user)
      const notUsersProjects = await givenMultipleProjects(5, {}, undefined) // create some other projects belonging to other users
      const [project] = notUsersProjects

      const { req, res } = createMocks({
        method: 'GET',
        url: getUrl(project._id),
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        }
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(403)
    })
  })

  describe('PATCH', () => {
    it('a user can update a project', async () => {
      const user = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      const project = await givenAProject({}, user)
      const projectData = givenProjectData()
      const { req, res } = createMocks({
        method: 'PATCH',
        url: getUrl(project._id),
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        },
        body: projectData
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(201)
      const updatedProject = await getProject(project._id)
      expect(updatedProject.name).toEqual(projectData.name)
      expect(updatedProject.description).toEqual(projectData.description)
      expect(String(updatedProject.industryId)).toEqual(String(projectData.industryId))
    })
    it('a user cannot update a project that he does not belong to', async () => {
      const user = await givenAUser() as any as User
      const user2 = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      const project = await givenAProject({}, user2)
      const projectData = givenProjectData()
      const { req, res } = createMocks({
        method: 'PATCH',
        url: getUrl(project._id),
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        },
        body: projectData
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(403)
      const updatedProject = await getProject(project._id)
      expect(updatedProject.name).toEqual(project.name)
      expect(updatedProject.description).toEqual(project.description)
      expect(String(updatedProject.industryId)).toEqual(String(project.industryId))
    })
  })

  describe('DELETE', () => {
    it('a user can delete one of his projects', async () => {
      const user = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      const project = await givenAProject({}, user)
      const { req, res } = createMocks({
        method: 'DELETE',
        url: getUrl(project._id),
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        }
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(201)
      const deletedProject = await getProject(project._id)
      expect(deletedProject == null).toEqual(true)
    })
    it('a user cannot delete a project that he does not own', async () => {
      const user = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      const user2 = await givenAUser() as any as User
      const project = await givenAProject({}, user2)
      const { req, res } = createMocks({
        method: 'DELETE',
        url: getUrl(project._id),
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        }
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(403)
      const deletedProject = await getProject(project._id)
      expect(deletedProject != null).toEqual(true)
    })
  })
})

/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/index'
import { givenAUser, givenAnAuthenticationToken, givenMultipleProjects, givenProjectData, setupMongoDB } from '@/util/test-utils'
import { User } from '@/src/types/user'
import { Project } from '@/src/types/project'
import { addUserAndCreateActivity } from '@/src/models/project'

const PATH = '/api/projects/index'
const url = `http://localhost:3000${PATH}`

describe(PATH, () => {
  setupMongoDB()

  describe('POST', () => {
    it('a user can create a project', async () => {
      const user = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)

      const bodyData = givenProjectData()

      const { req, res } = createMocks({
        method: 'POST',
        url,
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        },
        body: bodyData
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
      const project = res._getData() as Project
      expect(project).toHaveProperty('_id')
      expect(project).toHaveProperty('createdAt')
      expect(project.createdAt).toBeInstanceOf(Date)
      expect(project.name).toEqual(bodyData.name)
      expect(project.description).toEqual(bodyData.description)
      expect(String(project.industryId)).toEqual(bodyData.industryId)
      expect(project).toHaveProperty('createdBy')
      expect(String(project.createdBy)).toEqual(String(user._id))
      expect(project.roles).toBeInstanceOf(Array)
      expect(project.roles).not.toHaveLength(0)
      expect(project.userIds).toHaveLength(0)
    })

    it('returns unauthorized if accessed without authentication tokens', async () => {
      await givenAUser() as any as User
      const bodyData = givenProjectData()

      const { req, res } = createMocks({
        method: 'POST',
        url,
        body: bodyData
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(401)
    })
  })
  describe('GET', () => {
    it('a user can get all his projects', async () => {
      const user = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      const projects = await givenMultipleProjects(5, {}, user)
      // const notUsersProjects =
      await givenMultipleProjects(5, {}, undefined) // create some other projects belonging to other users

      const { req, res } = createMocks({
        method: 'GET',
        url,
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        }
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
      const projectsReturned = res._getData() as Project[]
      expect(projectsReturned).toHaveLength(projects.length)
      const projectIds = projects.map(p => String(p._id))
      const projectIdsReturned = projectsReturned.map(p => String(p._id))
      expect(projectIds).toEqual(expect.arrayContaining(projectIdsReturned))
    })
    it('a user can get all his and projects where he belongs too', async () => {
      const user = await givenAUser() as any as User
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      const projects = await givenMultipleProjects(5, {}, user)
      const notUsersProjects = await givenMultipleProjects(5, {}, undefined) // create some other projects belonging to other users

      await Promise.all([
        addUserAndCreateActivity(notUsersProjects[0]._id, notUsersProjects[0].createdBy, user._id),
        addUserAndCreateActivity(notUsersProjects[1]._id, notUsersProjects[1].createdBy, user._id)
      ])

      const { req, res } = createMocks({
        method: 'GET',
        url,
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        }
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
      const projectsReturned = res._getData() as Project[]
      expect(projectsReturned).toHaveLength(7)
      const projectIds = [...projects, notUsersProjects[0], notUsersProjects[1]].map(p => String(p._id))
      const projectIdsReturned = projectsReturned.map(p => String(p._id))
      expect(projectIds).toEqual(expect.arrayContaining(projectIdsReturned))
    })
  })
})

/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/users/[userId]/notification'
import { givenAUserAcceptingNotifications, givenAUser, givenAnAuthenticationToken, setupMongoDB } from '@/util/test-utils'
import { getNotificationSetting } from '@/src/models/notification-setting'

const PATH = '/api/users/[projectId]/notification'
// nextjs req will automatically parse the params from the url and add them to the query object but this is not done by node-mocks-http
const getUrl = (userId: string): string => `http://localhost:3000/api/users/${userId}/notification?userId=${userId}`

describe(PATH, () => {
  setupMongoDB()

  describe('PATCH', () => {
    it('a user can update his notification settings', async () => {
      const user = await givenAUserAcceptingNotifications()
      const token = await givenAnAuthenticationToken(user, process.env.JWT_SECRET)
      const notification = await getNotificationSetting(String(user._id))
      const updateData = {
        mentions: true,
        projectActivity: false,
        _id: String(user._id)
      }
      const { req, res } = createMocks({
        method: 'PATCH',
        url: getUrl(String(user._id)),
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        },
        body: updateData
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(204)
      const notificationUpdated = await getNotificationSetting(String(user._id))
      expect(notification.mentions).toBe(true)
      expect(notification.projectActivity).toBe(true)
      expect(notificationUpdated.mentions).toBe(updateData.mentions)
      expect(notificationUpdated.projectActivity).toBe(updateData.projectActivity)
    })

    it('a user cannot update someone else notification settings', async () => {
      const user1 = await givenAUser()
      const token = await givenAnAuthenticationToken(user1, process.env.JWT_SECRET)
      const user2 = await givenAUserAcceptingNotifications()
      const notification = await getNotificationSetting(String(user2._id))
      const updateData = {
        mentions: true,
        projectActivity: false,
        _id: String(user2._id)
      }
      const { req, res } = createMocks({
        method: 'PATCH',
        url: getUrl(String(user2._id)),
        headers: { Authorization: `Bearer ${token}` },
        cookies: {
          'next-auth.session-token': token
        },
        body: updateData
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(204)
      const notificationUpdated = await getNotificationSetting(String(user2._id))
      expect(notification.mentions).toBe(true)
      expect(notification.projectActivity).toBe(true)
      expect(notificationUpdated.mentions).toBe(true)
      expect(notificationUpdated.projectActivity).toBe(true)

      const notificationUpdated2 = await getNotificationSetting(String(user1._id))
      expect(notificationUpdated2.mentions).toBe(updateData.mentions)
      expect(notificationUpdated2.projectActivity).toBe(updateData.projectActivity)
    })
  })
})

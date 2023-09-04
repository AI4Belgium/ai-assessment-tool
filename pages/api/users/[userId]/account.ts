import type { NextApiRequest, NextApiResponse } from 'next'
import { isConnected, isCurrentUser } from '@/util/custom-middleware'
import templates from '@/util/mail/templates'
import { sendMail } from '@/util/mail'
import { getUser, getUsers, updateToDeletedUser } from '@/src/models/user'
import { getServerSession } from 'next-auth'
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getUserProjects, removeUser } from '@/src/models/project'
import { Project } from '@/src/types/project'
import { User } from '@/src/types/user'

interface SendEmailUserRemoved {
  project: string
  recipients: string[]
}

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const session = await getServerSession(req, res, authOptions)
  const user: any = await getUser({ _id: String(session?.user?.name) })
  let { userId } = req.query
  userId = String(userId)

  /**
   * Function used to retrieve all projects and users emails of theses projects which the deleted user used to be part of.
   * @returns SendEmailUserRemoved[]
   */
  async function buildProjectAndUsersEmails (): Promise<SendEmailUserRemoved[]> {
    const projects: Project[] = await getUserProjects(String(userId)) // retrieves all project that user to be deleted is part of.
    const response = await Promise.all(
      projects.map(async p => {
        const users = await getUsers(p.userIds) // retrieves all members of projects which to be deleted user is part of.
        const userCreatedBy = await getUser({ _id: p.createdBy }) // includes creator of the project
        const recipients = users.filter(user => user?.isDeleted !== true).map(user => user.email) // adds project users only if they're not deleted
        recipients.push(userCreatedBy?.isDeleted !== true ? userCreatedBy?.email ?? '' : '') // adds creator of the project only if they're not deleted
        return {
          project: p.name,
          recipients
        }
      })
    )
    return response
  }

  /**
   * Sends email to deleted user to notify their account has been deleted
   */
  const notifyDeletedUserByEmail = async (): Promise<void> => {
    const htmlContent = templates.deletedUserAccountHtml()
    await sendMail(user.email, 'Deleted account', htmlContent)
  }

  /**
   * Notifies by email all users of all projects that deleted user was part of.
   * @param user
   */
  const notifyMembersProjectAboutDeletedUserByEmail = async (user: User): Promise<void> => {
    const notificateUsersProject = await buildProjectAndUsersEmails()
    notificateUsersProject.map(async array => {
      const htmlContent = templates.notificationDeletedUserHtml(`${user.firstName} ${user.lastName}`, user.email, array.project)
      await sendMail(array.recipients, 'User part of project had their account deleted', htmlContent)
    })
  }

  switch (req.method) {
    case 'DELETE': {
      if (String(user._id) !== userId) return res.status(403).json({ message: 'You are not authorized to update this user' })
      // update user to inactive in all projects which user is part of.
      const allProjectIdsUser = await getUserProjects(userId)
      allProjectIdsUser.map(async project => await removeUser(project._id, String(userId))) // remove user from user project lists and put user into project inactive user lists.
      await updateToDeletedUser(userId) // marks user as deleted
      if (user == null) {
        return res.status(422).json({ code: 10007 })
      } else {
        await notifyMembersProjectAboutDeletedUserByEmail(user)
        await notifyDeletedUserByEmail()
      }
      return res.send(200)
    }
    default:
      return res.status(400).send({ message: 'Invalid request' })
  }
}

export default isCurrentUser(isConnected(handler))

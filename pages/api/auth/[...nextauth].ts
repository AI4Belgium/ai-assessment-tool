import NextAuth, { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextApiRequest } from 'next'
import { verifyPassword } from '@/util/auth'
import { invitedUserHandler } from '@/src/models/token'
import { sanitize } from '@/src/models/mongodb'
import { getUser } from '@/src/models/user'
import isEmpty from 'lodash.isempty'

const authorize: any = async (credentials: any, req: NextApiRequest): Promise<User | null> => {
  // Check any field is empty
  if (isEmpty(credentials.email) || isEmpty(credentials.password)) throw new Error('email or password is missing')
  const email = sanitize(credentials.email.trim().toLowerCase())
  const { token } = req.body
  const user = await getUser({ email }, [])

  if (user == null) throw new Error('Wrong credentials')
  if (user.isDeleted === true) throw new Error('User has no longer access')

  const isValid = await verifyPassword(
    credentials.password, // don't need to sanitize because it's hashed
    user?.password ?? ''
  )

  if (!isValid) throw new Error('Wrong credentials')
  if (token != null) await invitedUserHandler(sanitize(token), email)
  const userId = String(user._id)
  // this is a hack "name: userId" to have the user id without having to fetch hime again
  // because it's not passed along to the frontend
  return { email: user.email, id: userId, name: userId }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: 'email', type: 'text', placeholder: 'your email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize
    })
  ],
  secret: process.env.JWT_SECRET_KEY,
  callbacks: {
    async session ({ session, token, user }) {
      return session
    }
  }
}

export default NextAuth(authOptions)

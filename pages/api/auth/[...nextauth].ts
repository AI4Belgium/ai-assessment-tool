import NextAuth, { NextAuthOptions, User } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import CredentialsProvider from "next-auth/providers/credentials"

import { verifyPassword } from '@/util/auth'
import { invitedUserHandler } from '@/util/token'
import sanitize from 'mongo-sanitize'
import { getUser } from '@/util/user'
import isEmpty from 'lodash.isempty'

const authorize: any = async (credentials: any, req): Promise<User | null> => {
  // Check any field is empty
  if (isEmpty(credentials.email)  || isEmpty(credentials.password)) throw new Error('email or password is missing')
  const email = sanitize(credentials.email.trim().toLowerCase())
  const { token } = req.body
  const user = await getUser({ email }, [])

  if (user == null) throw new Error('Wrong credentials')

  const isValid = await verifyPassword(
    credentials.password, // don't need to sanitize because it's hashed
    user?.password ?? ''
  )
  if (!isValid) throw new Error('Wrong credentials')
  if (token != null) await invitedUserHandler(sanitize(token), email)
  return { email: user.email, id: user._id }
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
  secret: process.env.JWT_SECRET_KEY
}

export default NextAuth(authOptions)

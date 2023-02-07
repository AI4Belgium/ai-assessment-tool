import { hashPassword } from '@/util/auth'
import { cleanEmail } from '@/src/models/mongodb'
import sanitize from 'mongo-sanitize'
import { invitedUserHandler, createEmailVerificationToken } from '@/src/models/token'
import { createUser, getUser } from '@/src/models/user'
import { isEmailValid, isPasswordValid } from '@/util/validator'

async function handler (req, res): Promise<any> {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  let { email, password, firstName, lastName, token } = req.body
  email = cleanEmail(email)
  firstName = sanitize(firstName)
  lastName = sanitize(lastName)
  token = token != null ? sanitize(token) : token

  if (!isEmailValid(email)) {
    return res.status(422).json({ message: 'The email you provided in not valid' })
  }

  if (!isPasswordValid(password)) {
    return res.status(422).json({
      message: 'The password should be at least 8 characters long and contain a special character'
    })
  }

  const existingUser = await getUser({ email })
  if (existingUser != null) {
    return res.status(422).json({ message: 'Email is already used!' })
  }

  const hashedPassword = await hashPassword(password)
  const user = await createUser({
    email,
    password: hashedPassword,
    firstName,
    lastName
  })
  if (user?._id != null) {
    if (token != null) await invitedUserHandler(token, email)
    void createEmailVerificationToken(email, user._id)
    return res.status(201).send({ message: 'success' })
  }
  return res.status(400).send({ message: 'Your account creation failed. Please try again later.' })
}

export default handler

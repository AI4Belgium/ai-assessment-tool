import {
  hash,
  // genSalt,
  compare
} from 'bcryptjs'

export async function hashPassword (password: string): Promise<string> {
  const SALT_ROUNDS = +(process.env.SALT_ROUNDS ?? 12)
  // const salt = await genSalt(SALT_ROUNDS)
  const hashedPassword = await hash(password, SALT_ROUNDS)
  return hashedPassword
}

export async function verifyPassword (password: string, hashedPassword: string): Promise<boolean> {
  const isValid = await compare(password, hashedPassword)
  return isValid
}

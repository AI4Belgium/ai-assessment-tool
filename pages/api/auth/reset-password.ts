import { hashPassword } from '@/util/auth'
import { cleanEmail, sanitize } from '@/src/models/mongodb'
import { getToken, createResetPasswordToken, TokenType, isTokenExpired, setStatus, TokenStatus } from '@/src/models/token'
import { getUser, resetPassword } from '@/src/models/user'
import { isPasswordValid } from '@/util/validator'
import { csrf } from '@/util/csrf'
import { sendMail } from '@/util/mail'
import templates from '@/util/mail/templates'
import { NextApiRequest, NextApiResponse } from 'next'

async function handler (req: NextApiRequest, res: NextApiResponse): Promise<any> {
  if (req.method !== 'POST') return res.status(405).json({ code: 10001 })

  let { email, password, token } = req.body
  email = email != null ? cleanEmail(email) : null
  token = token != null ? sanitize(token) : token

  if (token != null && password != null) {
    const tokenEnt = await getToken({ token, type: TokenType.RESET_PASSWORD })
    if (tokenEnt == null) return res.status(400).json({ code: 10002 })
    if (isTokenExpired(tokenEnt) || tokenEnt.status === TokenStatus.EXPIRED) {
      void setStatus(tokenEnt.token, TokenStatus.EXPIRED)
      return res.status(400).json({ code: 10003 })
    }
    if (!isPasswordValid(password)) return res.status(400).json({ code: 10004 })

    const hashedPassword = await hashPassword(password)
    const result = tokenEnt.createdBy != null ? await resetPassword(tokenEnt.createdBy, hashedPassword) : null
    if (result != null) {
      void setStatus(tokenEnt.token, TokenStatus.REDEEMED)
      return res.status(201).send({ code: 10005 })
    }
    return res.status(400).json({ code: 9004 })
  } else if (email != null) {
    const user = await getUser({ email })
    if (user?._id == null) {
      return res.status(422).json({ code: 10007 })
    } else {
      const tokenEnt = await getToken({ createdBy: user._id, type: TokenType.RESET_PASSWORD })
      // check if there is a token that was created less than 2 minutes ago
      if (tokenEnt != null && +tokenEnt.createdAt + (60 * 2 * 1000) > Date.now()) {
        return res.status(400).json({ code: 10008 })
      }
      const tokenEnt2 = await createResetPasswordToken(user._id)
      const htmlContent = templates.getResetPasswordHtml(tokenEnt2.token)
      // const result =
      await sendMail(user.email, 'Reset password', htmlContent)
      return res.status(200).json({ code: 10009 })
    }
  }
}
export default csrf(handler)

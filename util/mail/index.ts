
import nodemailer, { SentMessageInfo } from 'nodemailer'
import isEmpty from 'lodash.isempty'

const SMTP_FROM: string | undefined = process.env.SMTP_FROM
const SMTP_HOST: string | undefined = process.env.SMTP_HOST
const SMTP_USER: string | undefined = process.env.SMTP_USER
const SMTP_PASS: string | undefined = process.env.SMTP_PASS
// const BASE_URL: string | undefined = process.env.BASE_URL

const throwMissingEnvVar = (varName: string): void => {
  throw new Error(`missing ${varName} environment variable`)
}

['SMTP_FROM', 'SMTP_USER', 'SMTP_PASS'].forEach((key) => process.env[key] == null && throwMissingEnvVar(key))

export const sendMailToBcc = async (subject: string, html: string | null = null, text = null, bcc: string | string[] = []): Promise<SentMessageInfo> => {
  return await sendMail(String(SMTP_FROM), subject, html, text, [], bcc)
}

export const sendMailWithSelfInBcc = async (to: string | string[], subject: string, html: string | null = null, text = null, cc: string | string[] = [], bcc: string | string[] = [SMTP_FROM as string]): Promise<SentMessageInfo> => {
  return await sendMail(String(SMTP_FROM), subject, html, text, cc, bcc)
}

export const sendMail = async (to: string | string[], subject: string, html: string | null = null, text = null, cc: string | string[] = [], bcc: string | string[] = []): Promise<SentMessageInfo> => {
  const port: number = +(process.env.SMTP_PORT ?? 587)
  const options = {
    host: SMTP_HOST ?? 'smtp.ethereal.email',
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  }
  const transporter = nodemailer.createTransport(options)
  const mailOptions: any = {
    from: SMTP_FROM, // sender address
    to, // list of receivers
    subject // Subject line
  }
  if (!isEmpty(html)) mailOptions.html = html
  if (!isEmpty(text)) mailOptions.text = text
  if (!isEmpty(cc)) mailOptions.cc = cc
  if (!isEmpty(bcc)) mailOptions.bcc = bcc
  // send mail with defined transport object
  const info = await transporter.sendMail(mailOptions)
  // console.log(info)
  transporter.close()
  return info
}

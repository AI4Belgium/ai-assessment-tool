import { Project } from '@/src/types/project'

const BASE_URL = process.env.BASE_URL ?? ''

export const htmlLogo = `
  <h1 style="font-size: 40px;">
    <p style="color: #0000E6; font-weight: 600; font-family: Helvetica,Arial,sans-serif; text-align: center;">
      AI<sub style="color: #000;">4</sub>Belgium
    </p>
  </h1>
`

export function getInvitationHtml (page: string, token: string, email: string, projectId: string, hostname: string): string {
  return `
    <style>
      a:hover { color: #333; text-decoration: none; }
    </style>

    <article style="display: block; text-align: left; width: 650px; margin: 0 auto;">
      ${htmlLogo}

      <div style="font: 20px Helvetica, sans-serif; color: #333;">
          <p>You have been invited for the assessment of an AI project!</p>
          <p>To accept the invite please click
            <a href='${hostname}/${page}?token=${token}&email=${email}&projectId=${projectId}'>
              here
            </a>
          </p>
          <p>&mdash; The Team</p>
      </div>
    </article>
  `
}

export function getResetPasswordHtml (token: string, hostname: string): string {
  return `
    <style>
      a:hover { color: #333; text-decoration: none; }
    </style>

    <article style="display: block; text-align: left; width: 650px; margin: 0 auto;">
      ${htmlLogo}

      <div style="font: 20px Helvetica, sans-serif; color: #333; text-align: center;">
          <p>You have requested a password reset!</p>
          <p>To reset your password please click
            <a href='${hostname}/reset-password?token=${token}'>
              here
            </a>
            .
          </p>
          <p>This link is valid for 2h!</p>
          <br />
          <p>If you didn't ask for a password reset you can ignore this email.</p>
          <p>&mdash; The Team</p>
      </div>
    </article>
  `
}

export function getVerifyEmailHtml (code: string): string {
  return `
  <article style="display: block; text-align: center; width: 370px; margin: 0 auto;">
    ${htmlLogo}

    <div style="font: 20px Helvetica,sans-serif; color: #333; text-align: center;">
      <div>Use this code to verify your email</div>
      <div style='text-align: center; padding: 10px;'>
        <span style="padding: 10px; color: black; background-color: lightgrey; border-radius: 15px; font-size: 30px;" >
          ${code}
        </span>
      </div>
      <div style='text-align: center;'>This code is valid for 24h!</div>
      <div style='text-align: center;'>&mdash; The Team</div>
    </div>
  </article>
  `
}

export function commentMentionHtml (commentId: string, projectId: string, cardId: string, hostname: string = BASE_URL): string {
  return `
  <div style="text-align: center;">
      ${htmlLogo}
      <span>
        You have been mentioned in a comment,
          <a href='${hostname}/projects/${projectId}?card=${cardId}&comment=${commentId}'>
            click here
          </a> to see it
      </span>
    </div>
  `
}

export function getProjectActivityHtml (projects: Project[], hostname: string = BASE_URL): string {
  return `
    <div style="display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start;">
      ${htmlLogo}
      <span>
        There is new activity on your project${projects.length > 1 ? 's' : ''}:
      </span>
      ${projects.map(project => `<a href='${hostname}/projects/${project._id}'>${project.name}</a>`).join('')}
    </div>
  `
}

const templates = {
  getInvitationHtml,
  getResetPasswordHtml,
  getVerifyEmailHtml,
  commentMentionHtml,
  getProjectActivityHtml
}

export default templates

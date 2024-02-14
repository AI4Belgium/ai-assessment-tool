import SignUp from '@/src/components/signup'
import { getServerSession } from 'next-auth/next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { sanitize } from '@/src/models/mongodb'
import { getUser } from '@/src/models/user'
import { getToken, TokenStatus } from '@/src/models/token'
import isEmpty from 'lodash.isempty'
import { Session } from 'next-auth'

export default function SignUpPage ({ session }: { session: Session }): JSX.Element {
  return (<SignUp />)
}

export async function getServerSideProps (ctx: any): Promise<any> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  let { token, email, projectId } = ctx.query
  email = !isEmpty(email) ? sanitize(decodeURIComponent(String(email)).trim().toLowerCase()) : null
  projectId = String(sanitize(projectId))
  token = String(sanitize(token))
  if (!isEmpty(token) && !isEmpty(email) && !isEmpty(projectId)) {
    // If token is invalid then redirect to error page
    const tokenValue = token != null ? await getToken({ token }) : null
    if ((tokenValue == null) || tokenValue?.status !== TokenStatus.PENDING) {
      return {
        redirect: {
          destination: '/signup',
          permanent: false
        }
      }
    }

    // If the invited user is a registered user
    const isExistingUser = await getUser({ email })

    if (isExistingUser != null) {
      return {
        redirect: {
          destination: `/login?token=${String(token)}&email=${encodeURIComponent(email)}&projectId=${String(projectId)}`,
          permanent: false
        }
      }
    }
  }

  if (session != null) {
    return {
      redirect: {
        destination: '/home',
        permanent: false
      }
    }
  }

  return {
    props: {
      session,
      ...await serverSideTranslations(ctx.locale as string, ['signup', 'cookies', 'placeholders', 'buttons', 'validations', 'links', 'api-messages', 'terms-and-conditions', 'privacy-policy'])
    }
  }
}

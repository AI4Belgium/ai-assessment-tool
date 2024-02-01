import Login from '@/src/components/login'
import { getSession } from 'next-auth/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function LoginPage ({ onSubmit }: { onSubmit?: Function }): JSX.Element {
  return (<Login onSubmit={onSubmit} />)
}

export async function getServerSideProps (ctx: any): Promise<any> {
  const session = await getSession()

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
      ...await serverSideTranslations(ctx.locale as string, ['buttons', 'cookies', 'placeholders', 'validations', 'exceptions', 'login', 'links', 'api-messages'])
    }
  }
}

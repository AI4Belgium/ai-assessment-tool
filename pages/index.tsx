import FrontPage from '@/src/components/front-page/front-page'
import { getSession } from 'next-auth/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default FrontPage

export async function getServerSideProps (context: any): Promise<any> {
  const session = await getSession(context)

  if (session?.user != null) {
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
      ...(await serverSideTranslations(context.locale as string, ['front-page', 'cookies', 'buttons', 'navbar', 'api-messages', 'terms-and-conditions', 'privacy-policy']))
    }
  }
}

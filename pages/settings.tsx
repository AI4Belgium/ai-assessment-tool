import { getServerSession } from 'next-auth/next'
import { Session } from 'next-auth'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import { Box, useBreakpointValue } from '@chakra-ui/react'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import Settings from '@/src/components/settings'
import SideBar from '@/src/components/side-bar'

const smVariant = { navigation: 'drawer', navigationButton: true }
const mdVariant = { navigation: 'sidebar', navigationButton: false }

const PAGE = 'settings'

export default function SettingsPage ({ session }: { session: Session }): JSX.Element {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const variants = useBreakpointValue({ base: smVariant, md: mdVariant })

  const toggleSidebar = (): void => setSidebarOpen(!isSidebarOpen)

  return (
    <SideBar
      page={PAGE}
      variant={variants?.navigation}
      isOpen={isSidebarOpen}
      onClose={toggleSidebar}
      showSidebarButton={variants?.navigationButton}
      onShowSidebar={toggleSidebar}
    >
      <Box>
        <Settings />
      </Box>
    </SideBar>
  )
}

export async function getServerSideProps (ctx: any): Promise<any> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)

  if (session == null) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }
  return {
    props: {
      session: JSON.parse(JSON.stringify(session)),
      ...await serverSideTranslations(ctx.locale as string, ['buttons', 'cookies', 'navbar', 'validations', 'settings', 'placeholders', 'img-input', 'api-messages'])
    }
  }
}

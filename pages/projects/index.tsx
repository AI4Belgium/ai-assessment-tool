import { useState } from 'react'
import useSWR from 'swr'
import { getServerSession } from 'next-auth/next'
import { useBreakpointValue } from '@chakra-ui/react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Projects from '@/src/components/projects'
import SideBar from '@/src/components/side-bar'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { fetcher } from '@/util/api'

const smVariant = { navigation: 'drawer', navigationButton: true }
const mdVariant = { navigation: 'sidebar', navigationButton: false }

export default function Page ({ session }: { session: any }): JSX.Element {
  const { data, mutate, isLoading } = useSWR('/api/projects', fetcher)
  // const { data: industries, error: errorIndustries } = useSWR('/api/industries', fetcher)
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const variants = useBreakpointValue({ base: smVariant, md: mdVariant })

  const toggleSidebar = (): void => setSidebarOpen(!isSidebarOpen)

  return (
    <SideBar
      page='projects'
      variant={variants?.navigation}
      isOpen={isSidebarOpen}
      onClose={toggleSidebar}
      showSidebarButton={variants?.navigationButton}
      onShowSidebar={toggleSidebar}
    >
      <Projects projects={data ?? []} session={session} fetchProjects={mutate} isLoading={isLoading} />
    </SideBar>
  )
}

export async function getServerSideProps (ctx: any): Promise<any> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)

  if (session?.user == null) {
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
      ...await serverSideTranslations(ctx.locale as string, ['buttons', 'cookies', 'navbar', 'projects', 'placeholders', 'api-messages', 'settings'])
    }
  }
}

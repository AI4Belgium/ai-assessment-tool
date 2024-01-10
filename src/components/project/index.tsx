import React, { FC, useState } from 'react'
import { Box, useBreakpointValue } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import ProjectColumns from '@/src/components/project/columns'
import { ProjectContextProvider } from '@/src/store/project-context'
import SideBar from '@/src/components/project/side-bar'
import NavBar from '@/src/components/navbar'
import ProgressBar, { SECTION_CHECKLIST } from '@/src/components/project/progress-bar'
import { Category, Project, Section } from '@/src/types/project'
import { QueryFilterKeys } from '@/src/components/project/project-bar/filter-menu'
import Checklist from '@/src/components/project/checklist'
import style from './index.module.scss'

const smVariant = { navigation: 'menu', navigationButton: true }
const mdVariant = { navigation: 'sidebar', navigationButton: false }

interface Props {
  project: Project
  session: any
  categories: Category[]
  sections: Section[]
  isLoading: boolean
}

const ProjectComponent: FC<Props> = (props): JSX.Element => {
  const router = useRouter()
  const { [QueryFilterKeys.STAGE]: stage } = router.query ?? {}
  const [isSidebarOpen] = useState(false)
  const variants = useBreakpointValue({ base: smVariant, md: smVariant, lg: mdVariant })

  const el = (
    <Box boxShadow='base' rounded='lg' bgColor='white' width={['100%', '100%', 'auto']}>
      <Box display='flex' position='relative'>
        <SideBar
          page='projects'
          variant={variants?.navigation}
          isOpen={isSidebarOpen}
          showSidebarButton={variants?.navigationButton}
        />
        <ProjectColumns project={props.project} isLoading={props.isLoading ?? false} />
      </Box>
    </Box>
  )

  return (
    <Box bgColor='#F7F7F7' width='100%' id='teadfadsf'>
      {props.project != null &&
        <ProjectContextProvider {...props}>
          <NavBar showSidebarButton={false} bg='white' />
          <Box display='flex' alignItems='center' flexDirection='column' className={style.container + ' print:m-0'} width='100%'>
            <ProgressBar my='1%' />
            {stage === SECTION_CHECKLIST.toUpperCase()
              ? <Checklist project={props.project} categories={props.categories} sections={props.sections} />
              : el}
          </Box>
        </ProjectContextProvider>}
    </Box>
  )
}

export default ProjectComponent

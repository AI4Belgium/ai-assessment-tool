import { Context, createContext, useState } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { Category, Project } from '@/src/types/project'
import { QueryFilterKeys } from '@/src/components/project/project-bar/filter-menu'
import { fetcher } from '@/util/api'
import { User } from '@/src/types/user'

interface ProjectContextType {
  project?: Project | undefined
  categories?: Category[]
  setProject?: any
  fetchUsers?: any
  categoryClickHandler?: any
  users?: any[]
  nonDeletedUsers?: any[]
  inactiveUsers?: any[]
}

const ProjectContext: Context<ProjectContextType> = createContext({})

export function ProjectContextProvider (props: any): JSX.Element {
  const router = useRouter()
  const [project, setProject] = useState<Project>(props.project)
  const [categories] = useState<Category[]>(props.categories)
  const { data: users, mutate } = useSWR(`/api/projects/${String(project._id)}/users`, fetcher)

  function categoryClickHandler (cat: Category): void {
    const {
      [QueryFilterKeys.CATEGORY]: currentCat
    } = router.query ?? {}
    const query: any = { ...router.query, [QueryFilterKeys.CATEGORY]: cat._id }

    if (currentCat === cat._id) delete query[QueryFilterKeys.CATEGORY] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    void router.push({
      query
    }, undefined, { shallow: true })
  }

  const context: ProjectContextType = {
    project,
    setProject,
    fetchUsers: mutate,
    categories,
    categoryClickHandler,
    users: users?.activeUsers,
    nonDeletedUsers: users?.activeUsers?.filter((user: User) => user.isDeleted !== true),
    inactiveUsers: users?.inactiveUsers
  }

  return (
    <ProjectContext.Provider value={context}>
      {props.children}
    </ProjectContext.Provider>
  )
}

export default ProjectContext

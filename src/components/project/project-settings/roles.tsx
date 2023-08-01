import React, { useState, useContext, useEffect } from 'react'
import {
  Avatar,
  AvatarGroup,
  Button,
  Input,
  Textarea,
  Box,
  useBreakpointValue,
  useDisclosure,
  Flex
} from '@chakra-ui/react'
import { HiOutlinePencil } from 'react-icons/hi'
import { RiAddCircleLine, RiDeleteBin6Line } from 'react-icons/ri'
import { FiUserPlus } from 'react-icons/fi'
import styles from './roles.module.css'
import { defaultFetchOptions, HTTP_METHODS } from '@/util/api'
import ProjectContext from '@/src/store/project-context'
import ConfirmDialog from '@/src/components/confirm-dialog'
import { UserMenu } from '@/src/components/user-menu'
import { getUserDisplayName } from '@/util/users'
import { Project, Role } from '@/src/types/project'
// import { useRouter } from 'next/router'

const UserMenuMemo = React.memo(UserMenu)

interface RoleBoxProps {
  project: Project
  role: Role
  deleteRole: (role: any) => void
  saveRole: (role: any, index: number) => Promise<Role | null>
  index: number
  [key: string]: any
}

const saveRoleApiCall = async (project: Project, role: Partial<Role>): Promise<Role | null> => {
  const projectId = String(project._id)
  const roleId = String(role._id)
  let url = `/api/projects/${projectId}/roles/${roleId}`
  let method = HTTP_METHODS.PATCH
  if (role._id == null) {
    url = `/api/projects/${projectId}/roles`
    method = HTTP_METHODS.POST
  }

  const response = await fetch(url, {
    ...defaultFetchOptions,
    method,
    body: JSON.stringify(role)
  })

  if (response.ok) {
    const updatedRole = await response.json()
    return updatedRole
  }
  return null
}

export const RoleBox = ({ project, role, deleteRole, saveRole, index }: RoleBoxProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false)
  const [, setIsUserAdd] = useState(false)
  // const [isLoading, setIsLoading] = useState(false)
  const [includedUsers, setIncludedUsers] = useState<any[]>([])
  const rows = useBreakpointValue({ base: 2, sm: 5 })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [name, setName] = useState(role.name)
  const [description, setDescription] = useState(role.desc)
  const [userIdTrigger, setUserIdTrigger] = useState(0)
  const { nonDeletedUsers = [] } = useContext(ProjectContext)

  useEffect(() => {
    if (Array.isArray(nonDeletedUsers)) {
      role.userIds = role.userIds ?? []
      const iu: any[] = nonDeletedUsers.filter(u => role.userIds?.includes(u._id))
      setIncludedUsers(iu)
    }
  }, [nonDeletedUsers, role.userIds, userIdTrigger])

  const setIsEditingWrapper = (value: boolean): void => {
    setIsEditing(value)
    setIsUserAdd(false)
  }
  // const setIsUserAddWrapper = (value: boolean): void => {
  //   setIsEditing(value)
  //   setIsUserAdd(false)
  // }

  const handleSave = async (e?: any): Promise<Role | null> => {
    if (e?.preventDefault != null) e.preventDefault()
    setIsEditingWrapper(false)
    const data: any = {}
    if (role._id != null) data._id = role._id
    if (role.name !== name) data.name = name
    if (role.desc !== description) data.desc = description
    return await saveRole(data, index)
  }

  const handleDelete = async (...args: any[]): Promise<void> => deleteRole(role)

  const onUserAdd = async (userId: string): Promise<void> => {
    role.userIds = role.userIds ?? []
    role.userIds.push(userId)
    if (role._id == null) {
      const updatedRole = await handleSave()
      if (updatedRole != null) role._id = updatedRole._id
    }
    setUserIdTrigger(userIdTrigger + 1)
    const url = `/api/projects/${String(project._id)}/roles/${String(role._id)}/users/${userId}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.POST,
      body: JSON.stringify({})
    })
    if (!response.ok) {
      role.userIds = role.userIds.filter(id => id !== userId)
      setUserIdTrigger(userIdTrigger + 1)
    }
  }

  const onUserRemove = async (userId: string): Promise<void> => {
    role.userIds = role.userIds ?? []
    role.userIds = role.userIds.filter(id => id !== userId)
    setUserIdTrigger(userIdTrigger + 1)
    const url = `/api/projects/${String(project._id)}/roles/${String(role._id)}/users/${userId}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: 'DELETE',
      body: JSON.stringify({})
    })
    if (!response.ok) {
      // TODO
    }
  }

  return (
    <Box display='flex' flexDirection='column' justifyContent='space-between' overflow='hidden' width={[200, 350]} height={[120, 168]} border='2px solid var(--primary-color)' borderRadius='15px' boxShadow='0px 4px 25px rgba(0, 0, 0, 0.07)' className='mt-1 p-2'>
      <Box>
        <Flex justifyContent='space-between'>
          <Input
            placeholder='Role name' size='xs' className={styles.input_class} disabled={!isEditing} border='0' cursor='pointer !important'
            value={name} onChange={(e): void => setName(e.target.value)}
          />
          {!isEditing &&
            <Flex>
              <HiOutlinePencil onClick={() => setIsEditingWrapper(true)} color='var(--primary-color)' cursor='pointer' />
              <RiDeleteBin6Line onClick={onOpen} color='var(--primary-color)' cursor='pointer' />
            </Flex>}
          {isEditing &&
            <Button onClick={(e) => { void handleSave(e) }} size='sm' className='ml-1'>Save</Button>}
        </Flex>
        <Textarea
          rows={rows}
          placeholder='Role description' disabled={!isEditing} className={'mt-1 ' + styles.textarea_class} border='0' p='0'
          value={description} onChange={(e): void => setDescription(e.target.value)}
        />
      </Box>
      <Flex justifyContent='space-between'>
        <Box />
        {!isEditing && (
          <Flex>
            <AvatarGroup size='sm' max={5}>
              {includedUsers.map(user => <Avatar key={user?._id} name={getUserDisplayName(user)} src={user.xsAvatar} />)}
            </AvatarGroup>
            <UserMenuMemo users={nonDeletedUsers} includedUserIds={role.userIds ?? []} onUserAdd={onUserAdd} onUserRemove={onUserRemove} userIdTrigger={userIdTrigger}>
              <FiUserPlus color='var(--primary-color)' cursor='pointer' />
            </UserMenuMemo>
          </Flex>
        )}
      </Flex>

      <ConfirmDialog isOpen={isOpen} onClose={onClose} confirmHandler={handleDelete} />
    </Box>
  )
}

const Roles = ({ project }: { project: Project }): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState(project.roles)

  const handleSave = async (role: Partial<Role>, index: number): Promise<Role | null> => {
    setIsLoading(true)
    const updatedRole = await saveRoleApiCall(project, role)
    if (updatedRole != null) {
      // use of map to create new array to trigger rerender
      let mapFn: any = (r: Role): Role => r._id === updatedRole._id ? updatedRole : r
      if (role._id == null) {
        mapFn = (r: Role, idx: number): Role => idx === index ? updatedRole : r
      }
      project.roles = project.roles?.map(mapFn) ?? [updatedRole]
      setRoles(project.roles)
    }
    setIsLoading(false)
    return updatedRole
  }

  const deleteRole = async (role: Partial<Role>): Promise<void> => {
    setIsLoading(true)
    if (role._id == null) {
      project.roles = project.roles?.filter(r => r !== role) ?? []
      setRoles(project.roles)
    } else {
      const url = `/api/projects/${String(project._id)}/roles/${String(role._id)}`
      const response = await fetch(url, {
        ...defaultFetchOptions,
        method: HTTP_METHODS.DELETE,
        body: JSON.stringify({ _id: role._id })
      })
      if (response.ok) {
        project.roles = project.roles?.filter(r => r._id !== role._id) ?? []
        setRoles(project.roles)
      }
    }
    setIsLoading(false)
  }

  const addRole = async (): Promise<void> => {
    setIsLoading(true)
    const data: Role = {
      name: '',
      desc: '',
      userIds: []
    }
    project.roles = [...(project.roles ?? []), data]
    setRoles(project.roles)
    setIsLoading(false)
  }

  return (
    <Flex flexDirection='column'>
      {Array.isArray(roles) && roles.map((role, index) =>
        <RoleBox key={`${index}-${String(role._id)}`} role={role} project={project} index={index} deleteRole={(role) => { void deleteRole(role) }} saveRole={handleSave} isLoading={isLoading} />)}
      <Flex
        width={[200, 350]} height={[120, 168]} boxShadow='0px 4px 25px rgba(0, 0, 0, 0.07)' borderRadius='15px' justifyContent='center' alignItems='center'
        cursor='pointer'
        onClick={() => { void addRole() }}
      >
        <RiAddCircleLine size='30px' color='#C9C9C9' />
      </Flex>
    </Flex>
  )
}

export default Roles

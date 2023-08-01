
import React, { useState, useContext } from 'react'
import useSWR from 'swr'
import {
  Box,
  useDisclosure,
  Flex,
  Avatar
} from '@chakra-ui/react'
import { RiDeleteBin6Line } from 'react-icons/ri'
import { useTranslation } from 'next-i18next'
import ProjectContext from '@/src/store/project-context'
import { defaultFetchOptions, fetcher, HTTP_METHODS } from '@/util/api'
import ConfirmDialog from '../../confirm-dialog'
import InviteModal from '../invite-user/modal'
import { getUserDisplayName } from '@/util/users'
import { Project } from '@/src/types/project'
import { User } from '@/src/types/user'

const InviteModalMemo = React.memo(InviteModal)
const ConfirmDialogMemo = React.memo(ConfirmDialog)

function emptyFn (): void {}

const Team = ({ project }: { project: Project }): JSX.Element => {
  const { t } = useTranslation()
  const context = useContext(ProjectContext)
  const { data, mutate } = useSWR(`/api/projects/${String(project._id)}/tokens/pending`, fetcher)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [, setIsLoading] = useState(false)
  const [deleteHandler, setDeleteHandler] = useState<Function>(() => emptyFn)

  const deleteUser = async (user: Partial<User>): Promise<void> => {
    setIsLoading(true)
    const data: any = {
      projectName: project.name
    }
    const url = `/api/projects/${String(project._id)}/users/${String(user._id)}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.DELETE,
      body: JSON.stringify(data)
    })
    if (response.ok) {
      context.nonDeletedUsers = context.nonDeletedUsers?.filter((u: any) => u._id !== user._id)
      project.userIds = project.userIds?.filter(uid => uid !== user._id)
      context.setProject(project)
      await context.fetchUsers()
    }
    setDeleteHandler(() => emptyFn)
    setIsLoading(false)
  }

  const deleteToken = async (token: any): Promise<void> => {
    setIsLoading(true)
    const url = `/api/projects/${String(project._id)}/tokens/${String(token._id)}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.DELETE
    })
    if (response.ok) await mutate()
    setDeleteHandler(() => emptyFn)
    setIsLoading(false)
  }

  const setDeleteHandlerWrapper = (instance: any, isUser = true): void => {
    async function deleteUserFn (): Promise<any> { await deleteUser(instance) }
    async function deleteTokenFn (): Promise<any> { await deleteToken(instance) }
    setDeleteHandler(isUser ? () => deleteUserFn : () => deleteTokenFn)
    onOpen()
  }

  const closeHandler = (): void => {
    setDeleteHandler(() => emptyFn)
    onClose()
  }

  return (
    <>
      <Flex flexDirection='column' className='mb-2'>
        <Box className='text-grey mt-2'>{t('project-settings:project-users')}</Box>
        <hr className='my-2' />
        {context.nonDeletedUsers != null && context.nonDeletedUsers?.length > 0 && context.nonDeletedUsers.map((user) => (
          <Flex key={user._id} justifyContent='space-between' alignItems='center' paddingY='1'>
            <Flex alignItems='center'>
              <Avatar size='xs' name={getUserDisplayName(user)} src={user.xsAvatar} mr='2' />
              <Box>{getUserDisplayName(user)}</Box>
            </Flex>
            {user._id.toString() !== project.createdBy.toString()
              ? (<RiDeleteBin6Line cursor='pointer' onClick={() => setDeleteHandlerWrapper(user)} color='var(--primary-color)' />)
              : (<></>)}
          </Flex>
        ))}
        {Array.isArray(data) &&
          <>
            <Box className='text-grey mt-3'>{t('project-settings:pending-invites')}</Box>
            <hr className='my-2' />
            {data.map((token) => (
              <Flex key={token._id} justifyContent='space-between' alignItems='center' paddingY='1'>
                <Box>{token.email}</Box>
                <RiDeleteBin6Line cursor='pointer' onClick={() => setDeleteHandlerWrapper(token, false)} color='var(--primary-color)' />
              </Flex>
            ))}
          </>}
      </Flex>
      <InviteModalMemo project={project} callback={mutate} />
      {typeof deleteHandler === 'function' && <ConfirmDialogMemo isOpen={isOpen} onClose={closeHandler} confirmHandler={deleteHandler} />}
    </>
  )
}

export default Team

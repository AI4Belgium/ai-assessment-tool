import React, { MouseEvent, useContext, useEffect, useState } from 'react'
import {
  BoxProps,
  Flex,
  ModalCloseButton,
  Text,
  Box,
  Select,
  Avatar,
  useBreakpointValue,
  IconButton
} from '@chakra-ui/react'
import { RiDeleteBin6Line } from 'react-icons/ri'
import ProjectContext from '@/src/store/project-context'
import { getUserDisplayName } from '@/util/users'
import { defaultFetchOptions, HTTP_METHODS, getResponseHandler } from '@/util/api'
import { SingleDatepicker } from '@/src/components/date-picker'
import { FiEdit2 } from 'react-icons/fi'
import { format } from 'date-fns'
import { UserMenu } from '@/src/components/user-menu'
import { Card, CardStage, STAGE_VALUES } from '@/src/types/card'
import ToastContext from '@/src/store/toast-context'
import { useTranslation } from 'next-i18next'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'

// ugly hack to get around the fact that the SingleDatepicker  Property 'children' does not exist on type 'IntrinsicAttributes & SingleDatepickerProps'.
const SingleDatepicker2 = SingleDatepicker as any

interface SidebarProps extends BoxProps {
  card: Card
}

const Sidebar = ({ card, ...boxProps }: SidebarProps): JSX.Element => {
  const { t } = useTranslation()
  const cardId = String(card._id)
  const projectId = String(card.projectId)
  const { showToast } = useContext(ToastContext)
  const [renderTrigger, setRenderTrigger] = useState(0)
  const responseHandler = getResponseHandler(showToast, t)
  const [assignedUsers, setAssignedUsers] = useState<any[]>([])
  const [, setIsLoading] = useState(false)
  const { nonDeletedUsers } = useContext(ProjectContext)
  const [collapsed, setCollapsed] = useState(true)

  const isMobile: boolean = useBreakpointValue({ base: true, sm: true, md: false }) ?? true

  const saveCard = async (data: Partial<Card>): Promise<void> => {
    setIsLoading(true)
    const url = `/api/projects/${projectId}/cards/${cardId}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(data)
    })
    if (response.ok) {
      Object.keys(data).forEach(key => {
        (card as any)[key] = (data as any)[key]
      })
    } else {
      await responseHandler(response)
    }
    setIsLoading(false)
  }

  const setDate = (date: Date | null | number): void => {
    card.dueDate = typeof date === 'number' ? new Date(date) : date
    void saveCard({ dueDate: card.dueDate })
  }

  const setStage = (stage: CardStage): void => {
    if (card.stage === stage) return
    card.stage = stage
    void saveCard({ stage })
  }

  const onUserAdd = async (userId: string): Promise<void> => {
    card.userIds = card.userIds ?? []
    card.userIds.push(userId)
    setRenderTrigger(renderTrigger + 1)
    const url = `/api/projects/${projectId}/cards/${cardId}/users/${userId}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.POST,
      body: '{}'
    })
    if (!response.ok) {
      card.userIds = card.userIds.filter(id => id !== userId)
      setRenderTrigger(renderTrigger + 1)
    }
  }

  const onUserRemove = async (userId: string): Promise<void> => {
    card.userIds = card.userIds ?? []
    card.userIds = card.userIds.filter(id => id !== userId)
    setRenderTrigger(renderTrigger + 1)
    const url = `/api/projects/${projectId}/cards/${cardId}/users/${userId}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.DELETE,
      body: '{}'
    })
    if (!response.ok) {
      await responseHandler(response)
    }
  }

  useEffect(() => {
    const userIds = card.userIds ?? []
    setAssignedUsers(nonDeletedUsers?.filter(user => userIds.includes(user._id)) ?? [])
  }, [card.userIds, renderTrigger])

  const props = {
    ...boxProps
  }
  const boxProps2: BoxProps = {}

  props.transition = 'max-width 1s ease-in-out'
  if (isMobile && collapsed) {
    props.maxW = '30px !important'
    props.minW = 'unset'
    props.minWidth = 'unset'
    if (boxProps.minW != null || boxProps.minWidth != null) {
      boxProps2.minW = boxProps.minW
      boxProps2.minWidth = boxProps.minWidth
    }
  }

  const toggleCollapse = (e: MouseEvent): void => {
    e.stopPropagation()
    e.preventDefault()
    setCollapsed(!collapsed)
  }

  return (
    <Flex flexDirection='column' backgroundColor='#FAFAFA' justifyContent='space-between' p={3} pt={[0]} {...props}>
      <Box position='sticky' top='0' {...boxProps2}>
        <Flex flexDirection='column' position='relative'>
          {isMobile &&
            <Box left={-4} mr={4} position='absolute'>
              <IconButton
                zIndex='1'
                size='xs'
                aria-label='Collapse sidebar'
                isRound
                icon={collapsed ? <ChevronLeftIcon w={4} h={4} /> : <ChevronRightIcon w={4} h={4} />}
                variant='outline'
                backgroundColor='transparent'
                onClick={toggleCollapse}
              />
            </Box>}
          <Flex justifyContent='flex-end'>
            <ModalCloseButton position='relative' {...(isMobile ? { top: 0, right: 0 } : {})} />
          </Flex>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text color='var(--main-blue)' fontSize='sm' as='b' mb='2'>{t('sidebar:due-date')}</Text>
          </Flex>
          <SingleDatepicker2 name='date-input' date={card.dueDate != null ? new Date(card.dueDate) : null} onDateChange={setDate}>
            <Flex justifyContent='space-between' alignItems='center'>
              <Text fontSize='sm' fontWeight='600' w='100%' minH='2'>
                {card.dueDate != null ? format(new Date(card.dueDate), 'dd MMM yyyy') : `${t('sidebar:define')}`}
              </Text>
              {card.dueDate != null && <RiDeleteBin6Line color='#C9C9C9' cursor='pointer' onClick={() => setDate(null)} />}
            </Flex>
          </SingleDatepicker2>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text color='var(--main-blue)' fontSize='sm' as='b' mt='3' mb='2'>{t('sidebar:assigned-to')}</Text>
            <UserMenu users={nonDeletedUsers ?? []} includedUserIds={card.userIds ?? []} onUserAdd={onUserAdd} onUserRemove={onUserRemove} userIdTrigger={renderTrigger}>
              <FiEdit2 color='#C9C9C9' cursor='pointer' />
            </UserMenu>
          </Flex>
          {assignedUsers.map(user => (
            <Flex key={user._id} paddingY='1'>
              <Avatar size='xs' name={getUserDisplayName(user)} src={user.xsAvatar} />
              <Text fontSize='sm' fontWeight='600' ml='2'>{getUserDisplayName(user)}</Text>
            </Flex>))}
          <label>
            <Text color='var(--main-blue)' fontSize='sm' as='b' mb='2'>{t('sidebar:stage')}</Text>
            <Select size='xs' value={card.stage ?? CardStage.DEVELOPMENT} onChange={(e) => setStage((e?.target?.value ?? card.stage) as CardStage)}>
              {STAGE_VALUES.map(stage => <option key={stage} value={stage} style={{ textTransform: 'capitalize' }}>{stage.toLowerCase()}</option>)}
            </Select>
          </label>
        </Flex>
      </Box>
    </Flex>
  )
}

export default Sidebar

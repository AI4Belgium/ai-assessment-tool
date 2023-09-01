import React, { FC, useContext, useState, useEffect } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { fetcher } from '@/util/api'
import {
  Button, Flex, Box, Spacer,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
  Divider,
  useDisclosure
} from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { RiArrowDropDownLine } from 'react-icons/ri'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import UserContext from '@/src/store/user-context'
import { User } from '@/src/types/user'
import { ActivityTimeline } from '@/src/components/activity'
import NotificationIcon from '@/src/components/notification-icon'
import { DisplayActivity } from '@/src/types/activity'
import EmailVerificationCheck from '@/src/components/email-verification-check'
import LocaleSwitcher from './locale-switcher'
interface Props {
  bg?: string
  onShowSidebar?: Function
  showSidebarButton?: boolean
}

export const AI4BelgiumIcon = (): JSX.Element => (
  <div className='px-3 py-3 flex flex-col justify-center icon-grey-color font-semibold text-lg cursor-pointer'>
    <span>
      AI<sub className='icon-blue-color text-lg'>4</sub>Belgium
    </span>
  </div>
)

function removeDuplicatesById (arr: any[]): any[] {
  const seenIds = new Set()
  return arr.filter(item => {
    if (seenIds.has(item._id)) {
      return false // Skip duplicates
    }
    seenIds.add(item.id)
    return true // Keep non-duplicates
  })
}

function processActivities (currentActivities: DisplayActivity[], newActivities: DisplayActivity[], setActivities: any, setUnReadActivities: any, userId: string): void {
  const newData = removeDuplicatesById(newActivities)
  const currentActivitiesIds = currentActivities.map(a => a._id)
  const currentActivitiesIdsSet = new Set(currentActivitiesIds)
  const dataToAdd = newData.filter((a: DisplayActivity) => !currentActivitiesIdsSet.has(a._id))
  const dataUpdated = currentActivities.map((a: DisplayActivity) =>
    newData.find((b: DisplayActivity) => a._id === b._id) ?? a
  )
  const activities = [...dataUpdated, ...dataToAdd]
  activities.sort((a: DisplayActivity, b: DisplayActivity) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  setActivities(activities)
  const unSeenAct = activities.filter((a: DisplayActivity) => a.createdBy !== userId && (a.seenBy == null || !a.seenBy.includes(userId)))
  setUnReadActivities(unSeenAct)
}

function ActivityDrawer (): JSX.Element {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user } = useContext(UserContext)
  const userId = String(user?._id)
  const [activities, setActivities] = useState<DisplayActivity[]>([])
  const [page, setPage] = useState<string | null>(null)
  const [unReadActivities, setUnReadActivities] = useState<DisplayActivity[]>([])
  const { data: lastestData } = useSWR('/api/activities', fetcher, { refreshInterval: 5000 })
  const { trigger, data, isMutating } = useSWRMutation(`/api/activities${page != null ? `?page=${page}` : ''}`, fetcher)

  useEffect(() => {
    if (data?.data != null) processActivities(activities, data.data, setActivities, setUnReadActivities, userId)
  }, [data])

  useEffect(() => {
    if (lastestData?.data != null) processActivities(activities, lastestData.data, setActivities, setUnReadActivities, userId)
  }, [lastestData])

  useEffect(() => {
    if (data == null && lastestData != null && lastestData.page != null) setPage(lastestData.page)
    else if (data?.page != null) setPage(data.page)
    else setPage(null)
  }, [lastestData, data])

  const loadMoreFn = async (): Promise<void> => {
    if (isMutating) return
    if (page != null) void trigger()
  }

  return (
    <>
      <NotificationIcon onClick={onOpen} showFlagNewNotifications={unReadActivities.length > 0} />
      <Drawer
        isOpen={isOpen}
        placement='right'
        onClose={onClose}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {t('navbar:activity')}
            {/* <FormControl display='flex' alignItems='center'>
              <Switch id='personal-activity' size='sm' mr='1' />
              <FormLabel htmlFor='personal-activity' mb='0' fontSize='xs'>
                Include my activity?
              </FormLabel>
            </FormControl>
            {!isEmpty(projectId) &&
              <FormControl display='flex' alignItems='center'>
                <Switch id='project-activity' size='sm' mr='1' />
                <FormLabel htmlFor='project-activity' mb='0' fontSize='xs'>
                  Show only this project?
                </FormLabel>
              </FormControl>} */}
          </DrawerHeader>

          <DrawerBody>
            <ActivityTimeline total={data?.total ?? lastestData?.total ?? 0} activities={activities} loadMoreFn={loadMoreFn} />
          </DrawerBody>

          <DrawerFooter>
            <Button variant='outline' mr={3} onClick={onClose} size='sm'>
              {t('navbar:close')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

const RenderButtons = ({ user }: { user: User | null }): JSX.Element => {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: session } = useSession()

  if (session?.user != null) {
    const logout = async (): Promise<void> => {
      // const response =
      await signOut({ redirect: false })
      await router.push('/')
    }

    /* eslint-disable @typescript-eslint/no-misused-promises */
    return (
      <>
        <Flex flexDirection='column' justifyContent='center'>
          <ActivityDrawer />
        </Flex>
        <Flex flexDirection='column' justifyContent='center' paddingX='2' position='relative'>
          <Divider orientation='vertical' height='50%' color='#F0EEF9' position='absolute' />
        </Flex>
        <Menu>
          <MenuButton mr='5px'>
            <Flex justifyContent='center' alignItems='center'>
              <Avatar
                size='sm'
                name={user != null ? `${user?.firstName} ${user?.lastName}` : ''}
                src={user?.xsAvatar}
                // backgroundColor='#F0EEF9'
                // icon={<BiUser size='20' className='icon-blue-color' />}
              />
              <RiArrowDropDownLine color='#F0EEF9' size='20' />
            </Flex>
          </MenuButton>
          <MenuList backgroundColor='white' zIndex='6'>
            <MenuItem onClick={() => { void router.push('/settings') }} className='icon-blue-color' color='#0000E6'>{t('buttons:settings')}</MenuItem>
            <MenuItem onClick={logout} className='icon-blue-color' color='#0000E6'>{t('buttons:log-out')}</MenuItem>
          </MenuList>
        </Menu>
      </>
    )
  }

  return (
    <>
      <Button fontSize='20' color='brand' variant='link' float='right' mr='2' pr='2'>
        <Link href='/login'>{t('buttons:log-in')}</Link>
      </Button>
      <Button fontSize='md' colorScheme='green' color='white' m='4'>
        <Link href='/signup'>{t('buttons:sign-up')}</Link>
      </Button>
    </>
  )
  /* eslint-enable @typescript-eslint/no-misused-promises */
}

const NavaBarInner = ({ bg, showSidebarButton = true, onShowSidebar }: Props): JSX.Element => {
  const router = useRouter()
  const { user } = useContext(UserContext)
  return (
    <Box bg={bg} boxShadow='md' className='print:hidden'>
      <Flex>
        {showSidebarButton && (
          <Box p={4} pr={2}>
            <IconButton
              icon={<ChevronRightIcon w={8} h={8} />}
              colorScheme='blackAlpha'
              aria-label='Show menu'
              variant='outline'
              onClick={onShowSidebar != null ? () => onShowSidebar() : () => { }}
            />
          </Box>
        )}
        <Box onClick={() => { void router.push('/home') }} margin='auto 0'>
          <AI4BelgiumIcon />
        </Box>
        <Spacer />
        <Flex flexDirection='column' justifyContent='center'>
          <LocaleSwitcher />
        </Flex>
        <Flex flexDirection='column' justifyContent='center' paddingX='2' position='relative'>
          <Divider orientation='vertical' height='50%' color='#F0EEF9' position='absolute' />
        </Flex>
        <RenderButtons user={user} />
      </Flex>
    </Box>
  )
}

const NavBar: FC<Props> = (props) => {
  return (
    <>
      <NavaBarInner {...props} />
      <EmailVerificationCheck />
    </>
  )
}

export default NavBar

import React, { useState, useContext, useEffect, MouseEvent } from 'react'
import {
  Box,
  Heading,
  FormControl,
  Button,
  Text,
  Checkbox,
  useToast
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { defaultFetchOptions, fetcher } from '@/util/api'
import UserContext from '../../store/user-context'
import useSWR from 'swr'

const NotificationSettings = (): JSX.Element => {
  const { t } = useTranslation()
  const { user } = useContext(UserContext)

  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [checkedItems, setCheckedItems] = React.useState({
    projectActivity: false,
    mentions: false
  })

  const { data } = useSWR(`/api/users/${String(user?._id)}/notification`, fetcher)

  useEffect(() => {
    if (data != null) {
      setCheckedItems(data)
    }
  }, [data])

  const changeNotifications = async (e: MouseEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    const url = `/api/users/${String(user?._id)}/notification`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: 'PATCH',
      body: JSON.stringify(checkedItems)
    })
    const toastDefaultOptions: any = {
      position: 'top',
      duration: 2500,
      isClosable: true
    }

    if (response.ok) {
      toast({
        ...toastDefaultOptions,
        title: t('settings:notifications-change-success-message'),
        status: 'success'
      })
    } else {
      toast({
        ...toastDefaultOptions,
        title: t('settings:notifications-change-error-message'),
        status: 'error'
      })
    }
    setIsLoading(false)
  }

  return (
    <Box p='2' height='fit-content' minW={300}>
      <Heading size='md'>{t('settings:notifications-by-email')}</Heading>
      <FormControl mt='4' display='flex' alignItems='center'>
        <Checkbox
          name='projectActivity'
          isChecked={checkedItems.projectActivity}
          onChange={e => setCheckedItems({ ...checkedItems, projectActivity: e.target.checked })}
        >{t('settings:project-activities')}
        </Checkbox>
      </FormControl>
      <Text fontSize='sm' color='var(--chakra-colors-gray-500)'>{t('settings:project-activities-caption')}</Text>

      <FormControl mt='4' display='flex' alignItems='center'>
        <Checkbox
          name='mentions'
          isChecked={checkedItems.mentions}
          onChange={e => setCheckedItems({ ...checkedItems, mentions: e.target.checked })}
        >{t('settings:mentions')}
        </Checkbox>
      </FormControl>
      <Text fontSize='sm' color='var(--chakra-colors-gray-500)'>{t('settings:mentions-caption')}</Text>
      <Button
        width='full'
        mt={4}
        onClick={changeNotifications} // eslint-disable-line @typescript-eslint/no-misused-promises
        isLoading={isLoading}
        loadingText={`${t('settings:updating')}`}
      >
        {t('buttons:update')}
      </Button>
    </Box>
  )
}

export default NotificationSettings

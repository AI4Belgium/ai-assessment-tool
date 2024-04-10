import React, { useState, useContext, useCallback, useMemo } from 'react'
import {
  Box, Heading, Button, Text
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import DeleteAccountModal from '../project/modals/delete-account-modal'
import UserContext from '@/src/store/user-context'
import ToastContext from '@/src/store/toast-context'
import { MAX_USER_AGED_DAYS, daysToMilliseconds } from '@/util/index'
import { defaultFetchOptions, HTTP_METHODS, getResponseHandler } from '@/util/api'

const DeleteAccountSettings = ({ autoDeleteAccount }: { autoDeleteAccount: boolean }): JSX.Element => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const { user, triggerReloadUser } = useContext(UserContext)
  const { showToast } = useContext(ToastContext)

  const responseHandler = useMemo(() => getResponseHandler(showToast, t), [showToast, t])

  const closeModalCb = (): void => {
    setShowModal(false)
  }

  const resetDeletionCounter = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    const url = `/api/users/${String(user._id)}/delete-prevention-date`

    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.POST,
      body: JSON.stringify({ })
    })
    if (!response.ok) {
      await responseHandler(response)
    } else {
      triggerReloadUser()
    }
    setIsLoading(false)
  }, [user, setIsLoading, triggerReloadUser])

  let daysBeforeDeletion = 0
  if (autoDeleteAccount) {
    const deletePreventionDate = new Date(user?.deletePreventionDate ?? user?.createdAt)
    daysBeforeDeletion = Math.round(+new Date(+deletePreventionDate + daysToMilliseconds(MAX_USER_AGED_DAYS) - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const resetDeletionCounterIsDisabled = MAX_USER_AGED_DAYS === daysBeforeDeletion

  return (
    <>
      <Box p='2' height='fit-content' minW={300}>
        <Heading size='md'>{t('settings:delete-account')}</Heading>
        <Button
          fontWeight='semibold'
          width='full'
          mt={4}
          isDisabled={user?._id == null}
          bg='danger'
          color='white'
          onClick={() => setShowModal(true)}
          isLoading={isLoading}
          loadingText={`${t('settings:deleting')}`}
        >
          {t('buttons:delete')}
        </Button>
        {autoDeleteAccount && (
          <>
            <Heading size='md' mt='8'>{t('settings:auto-account-deletion-title')}</Heading>
            <Text mt={4}>{t('settings:auto-account-deletion-days-left', { daysBeforeDeletion })}</Text>
            <Button
              fontWeight='semibold'
              width='full'
              mt={4}
              isDisabled={resetDeletionCounterIsDisabled || isLoading}
              colorScheme='green'
              color='white'
              onClick={resetDeletionCounter /* eslint-disable-line @typescript-eslint/no-misused-promises */}
              isLoading={isLoading}
            >
              {t('settings:auto-account-reset-deletion-counter')}
            </Button>
            {resetDeletionCounterIsDisabled && <Text fontSize='xs'>{t('settings:auto-account-disabled-btn-info', { daysToDisableButton: MAX_USER_AGED_DAYS })}</Text>}
          </>
        )}
      </Box>
      {showModal && <DeleteAccountModal onCloseCb={closeModalCb} />}
    </>
  )
}

export default DeleteAccountSettings

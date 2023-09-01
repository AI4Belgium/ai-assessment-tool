import React, { useState, useContext, useEffect, MouseEvent } from 'react'
import {
  Button,
  Input,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  ModalFooter
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { defaultFetchOptions, getResponseHandler, HTTP_METHODS } from '@/util/api'
import UserContext from '@/src/store/user-context'
import ToastContext from '@/src/store/toast-context'
import isEmpty from 'lodash.isempty'

interface EmailVerificationModalProps {
  email?: string
  isUpdate?: boolean
  openModal?: boolean
  getTokenAtInit?: boolean
  canAskForNewToken?: boolean
  successCb?: () => void
  cancelCb?: () => void
  failCb?: () => void
  onCloseCb?: () => void
}

export const EmailVerificationModal = ({
  email, isUpdate = false, getTokenAtInit = false, successCb, cancelCb, failCb, onCloseCb, canAskForNewToken = false
}: EmailVerificationModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { user, triggerReloadUser } = useContext(UserContext)
  const { showToast } = useContext(ToastContext)
  const [isLoading, setIsLoading] = useState(false)
  const { onClose } = useDisclosure()

  const responseHandler = getResponseHandler(showToast, t)

  useEffect(() => {
    if (getTokenAtInit) {
      setIsLoading(true)
      void initiateEmailVerificationRequest().catch(() => setIsLoading(false))
    }
  }, [])

  useEffect(() => {
    if (isEmpty(values.email) && !isEmpty(user?.email)) {
      setValues({ ...values, email: user?.email })
    }
  }, [user?.email])

  const [values, setValues] = useState({
    email: email ?? user?.email ?? '',
    token: null
  })
  const [touched, setTouched] = useState({
    email: false,
    token: false
  })

  const closeFn = (): void => {
    onClose()
    if (onCloseCb != null) onCloseCb()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setValues({ ...values, [name]: value })
    setTouchedWrapper(name, 800)
  }

  const setTouchedWrapper = (field: string, waitTimeMS = 0): void => {
    if ((touched as any)[field] !== true) {
      waitTimeMS > 0
        ? setTimeout(() => setTouchedWrapper(field, 0), waitTimeMS)
        : setTouched({ ...touched, [field]: true })
    }
  }

  const invalidateToken = async (): Promise<void> => {
    const { email } = values
    const url = `/api/users/${String(user?._id)}/email`
    await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.DELETE,
      body: JSON.stringify({ email })
    })
  }

  const cancelTokenVerification = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    if (getTokenAtInit) await invalidateToken()
    setValues({ email: user?.email ?? '', token: null })
    closeFn()
    if (cancelCb != null) cancelCb()
    setIsLoading(false)
  }

  const finializeVerification = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    const { email, token } = values
    const data: any = {
      email,
      token
    }
    const url = `/api/users/${String(user?._id)}/email/validate`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data)
    })
    await responseHandler(response, isUpdate ? `${t('settings:email-updated-successfully')}` : `${t('settings:email-verified-successfully')}`)
    if (response.ok) {
      await triggerReloadUser()
      closeFn()
      if (successCb != null) successCb()
    } else {
      if (failCb != null) failCb()
    }
    setIsLoading(false)
  }

  const initiateEmailVerificationRequest = async (e?: React.MouseEvent): Promise<void> => {
    if (e?.preventDefault != null) e.preventDefault()
    setIsLoading(true)
    const { email } = values
    const data: any = {
      email
    }
    const url = `/api/users/${String(user?._id)}/email`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.POST,
      body: JSON.stringify(data)
    })
    const resultCall = await response.json()
    const msg = t([`api-messages:${String(resultCall.code)}`, 'code'])
    await responseHandler(response, msg)
    setIsLoading(false)
  }

  const askForNewToken = async (e: MouseEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    await invalidateToken()
    await initiateEmailVerificationRequest()
    setIsLoading(false)
  }
  /* eslint-disable @typescript-eslint/no-misused-promises */
  return (
    <Modal onClose={closeFn} isOpen isCentered>
      <ModalOverlay />
      <ModalContent mr='2' ml='2'>
        <ModalHeader>{t('settings:email-address-verification')}</ModalHeader>
        <ModalCloseButton onClick={cancelTokenVerification} />
        <ModalBody>
          <Text>
            {isUpdate
              ? `${t('settings:update-new-email-message')}`
              : `${t('settings:update-email-message')}`}
          </Text>
          <Input placeholder={`${t('placeholders:code')}`} name='token' onChange={handleChange} />
          {canAskForNewToken && (
            <Button onClick={askForNewToken} isLoading={isLoading} isDisabled={isLoading} mt='1.5' variant='link'>
              {t('buttons:ask-new-code')}
            </Button>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={finializeVerification} colorScheme='blue' isLoading={isLoading} isDisabled={isLoading || isEmpty(values.token)} mr='1.5'>
            {t('buttons:verify')}
          </Button>
          <Button onClick={cancelTokenVerification} isLoading={isLoading} isDisabled={isLoading}>
            {t('buttons:cancel')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EmailVerificationModal

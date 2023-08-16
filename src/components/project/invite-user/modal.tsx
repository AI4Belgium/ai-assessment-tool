import React, { SyntheticEvent, useState, useContext } from 'react'
import {
  Box,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalCloseButton,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  useDisclosure,
  Input
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import { defaultFetchOptions } from '@/util/api'
import { isEmailValid } from '@/util/validator'
import ToastContext from '@/src/store/toast-context'
import { Project } from '@/src/types/project'

const InviteModal = ({ project, callback }: { project: Project, callback: Function }): JSX.Element => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { showToast } = useContext(ToastContext)
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState(false)
  const [isMailSending, setMailSending] = useState(false)

  const handleClick = async (e: SyntheticEvent): Promise<void> => {
    if (e?.preventDefault != null) e.preventDefault()
    if (e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.key !== 'Enter') return
    setMailSending(true)
    await sendEmail()
    setMailSending(false)
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    setEmail(e.target.value)
    validate()
  }

  const validate = (): void => {
    setEmailErr(!isEmailValid(email))
  }

  const sendEmail = async (): Promise<void> => {
    const url = '/api/mail'
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: 'POST',
      body: JSON.stringify({ email, projectId: project._id })
    })
    if (response.ok) {
      setEmail('')
      onClose()
      if (callback != null && typeof callback === 'function') await callback()
    } else {
      try {
        const error = await response.json()
        if (error.message != null) showToast({ title: t('exceptions:something-went-wrong'), description: error.message, status: 'error' })
        else showToast({ title: t('exceptions:something-went-wrong'), status: 'error' })
      } catch (err) {
        showToast({ title: t('exceptions:something-went-wrong'), status: 'error' })
      }
    }
  }
  /* eslint-disable @typescript-eslint/no-misused-promises */
  return (
    <>
      <Box>
        <Button onClick={onOpen}>
          {t('buttons:invite')}
        </Button>
      </Box>
      <Modal onClose={onClose} isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent mr='2' ml='2'>
          <ModalHeader>{t('project-settings:invite-user')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              type='email'
              value={email}
              onChange={handleChange}
              placeholder={`${t('placeholders:email')}`}
              onKeyUp={handleClick}
              ref={el => el?.focus()}
            />
          </ModalBody>
          {emailErr && <p>{emailErr}</p>}
          <ModalFooter>
            <Button
              disabled={!isEmailValid(email)}
              mr={3}
              onClick={handleClick}
              isLoading={isMailSending}
              loadingText={`${t('project-settings:sending')}`}
            >
              {t('buttons:invite')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default InviteModal

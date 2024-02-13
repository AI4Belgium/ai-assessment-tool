import React, { Fragment, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Flex,
  Switch,
  Divider,
  Grid
} from '@chakra-ui/react'
import { useTranslation, Trans } from 'next-i18next'
import { CookieConfig, useFedconsentCookie } from '@/src/hooks'
import LegalCookieButton from '@/src/components/cookie-consent/legal-cookie-button'

interface Props {
  onCloseCb?: () => void
  onOpenCb?: () => void
}

function CookieManagerModal (props: Props): JSX.Element {
  const { t } = useTranslation()
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true })
  const {
    onCloseCb,
    onOpenCb
  } = props
  const {
    saveFedconsentCookie,
    allowOptionalCookies,
    denyOptionalCookies,
    setConsentValue,
    COOKIE_CONFIG,
    cookieMemoryValue
  } = useFedconsentCookie()

  useEffect(() => {
    if (isOpen) {
      onOpenCb?.()
    } else if (!isOpen) {
      onCloseCb?.()
    }
  }, [isOpen, onOpenCb, onCloseCb])

  function close (): void {
    onClose()
    onCloseCb?.()
  }

  function handleCookieChange (e: React.ChangeEvent<HTMLInputElement>, id: string): void {
    setConsentValue(id, e.target.checked)
  }

  function confirmHandler (): void {
    saveFedconsentCookie()
    close()
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior='inside' size={['full', 'full', 'md']}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('cookies:cookieManager.header')}</ModalHeader>
          <ModalCloseButton onClick={close} />
          <ModalBody>
            <div className='mb-3'>
              <Trans
                t={t}
                components={{
                  button: <LegalCookieButton />
                }}
              >
                {t('cookies:cookieManager.message')}
              </Trans>
            </div>
            <Divider />

            <Flex my='4'>
              <Button colorScheme='teal' variant='outline' className='text-xs md:text-md mb-1 mr-1' mr={3} onClick={allowOptionalCookies}>
                {t('cookies:cookieActions.acceptOptional')}
              </Button>

              <Button colorScheme='teal' variant='outline' className='text-xs md:text-md mb-1 mr-1' mr={3} onClick={denyOptionalCookies}>
                {t('cookies:cookieActions.declineOptional')}
              </Button>
            </Flex>

            <Grid templateColumns='min-content auto' rowGap='3' columnGap='4' className='mb-3'>
              {COOKIE_CONFIG.map((cookieConf: CookieConfig) => (
                <Fragment key={cookieConf.id}>
                  <Switch mt='1.5' disabled={cookieConf.isDisabled} isChecked={cookieMemoryValue?.[cookieConf.id]} onChange={(e) => handleCookieChange(e, cookieConf.id)} name={cookieConf.id} className='p-0' />
                  <div>
                    <div>
                      <span className='font-bold'>{t(`cookies:cookieManager.cookies.${cookieConf.id}.label`)}</span> <span className='text-xs'>{t(`cookies:cookieManager.cookies.${cookieConf.id}.labelSuffix`)}</span>
                    </div>
                    <div className='text-xs'>{t(`cookies:cookieManager.cookies.${cookieConf.id}.description`)}</div>
                    <div className='text-gray-500 text-xs'>{t(`cookies:cookieManager.cookies.${cookieConf.id}.purpose`)}</div>
                  </div>
                </Fragment>
              ))}
            </Grid>
            <Divider />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='teal' variant='outline' className='text-xs md:text-md mb-1 mr-1' mr={3} onClick={confirmHandler}>
              {t('cookies:cookieActions.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default CookieManagerModal

import React, { useEffect } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  useDisclosure,
  Flex,
  Button
} from '@chakra-ui/react'
import { useTranslation, Trans } from 'next-i18next'
import { useFedconsentCookie } from '@/src/hooks'
import CookieManagerModal from '@/src/components/cookie-consent/cookie-manager-modal'
import LegalCookieButton from '@/src/components/cookie-consent/legal-cookie-button'

function CookieBanner (): JSX.Element {
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()
  const [modalOpen, setModalOpen] = React.useState(false)
  const {
    setOptionalCookies,
    fedconsentCookieBrowserValue
  } = useFedconsentCookie()

  function cookieHandler (accpetAll: boolean): void {
    setOptionalCookies(accpetAll, true)
    onClose()
  }

  function configureCookiesHandler (): void {
    setModalOpen(true)
  }

  function modalCloseCallback (): void {
    setModalOpen(false)
  }

  useEffect(() => {
    if (fedconsentCookieBrowserValue == null && !isOpen) {
      onOpen()
    } else if (isOpen) {
      onClose()
    }
  }, [fedconsentCookieBrowserValue])

  return (
    <>
      <Drawer placement={'bottom' as any} onClose={onClose} isOpen={isOpen} closeOnOverlayClick={false} blockScrollOnMount={!modalOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody>
            <div className='mr-5'>
              <Trans
                t={t}
                components={{
                  button: <LegalCookieButton />
                }}
              >
                {t('cookies:cookieBanner.message')}
              </Trans>
            </div>
            <Flex flexWrap='wrap' mt='1'>
              <Button colorScheme='teal' variant='outline' className='text-xs md:text-md mb-1 mr-1' onClick={configureCookiesHandler}>
                {t('cookies:cookieActions.configureCookies')}
              </Button>
              <Button colorScheme='teal' variant='outline' className='text-xs md:text-md mb-1 mr-1' onClick={() => cookieHandler(true)}>
                {t('cookies:cookieActions.acceptOptional')}
              </Button>
              <Button colorScheme='teal' variant='outline' className='text-xs md:text-md mb-1 mr-1' onClick={() => cookieHandler(false)}>
                {t('cookies:cookieActions.declineOptional')}
              </Button>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {modalOpen && <CookieManagerModal onCloseCb={modalCloseCallback} />}
    </>
  )
}

export default CookieBanner

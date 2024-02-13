import React from 'react'
import { useDisclosure } from '@chakra-ui/react'
import CookieManagerModal from '@/src/components/cookie-consent/cookie-manager-modal'

const ManageCookieButton = ({ children }: any): JSX.Element => {
  const { isOpen, onClose, onOpen } = useDisclosure()

  return (
    <>
      <a href='#' onClick={onOpen}>{children}</a>
      {isOpen && <CookieManagerModal onCloseCb={onClose} />}
    </>
  )
}

export default ManageCookieButton

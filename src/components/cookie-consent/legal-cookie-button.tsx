import React from 'react'
import { useDisclosure } from '@chakra-ui/react'
import LegalModal from '@/src/components/legal-modal'

const DEFAULT_INDEX = 1

const LegalCookieButton = ({ children, index = DEFAULT_INDEX }: any): JSX.Element => {
  const { isOpen, onClose, onOpen } = useDisclosure()

  return (
    <>
      <a href='#' onClick={onOpen}>{children}</a>
      {isOpen && <LegalModal isOpen={isOpen} onClose={onClose} defaultIndex={index} />}
    </>
  )
}

export default LegalCookieButton

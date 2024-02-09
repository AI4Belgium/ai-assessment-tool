import { useDisclosure } from '@chakra-ui/react'
import LegalModal from '@/src/components/legal-modal'

const TranslationButton = ({ children }: any): JSX.Element => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  return (
    <>
      <a href='#' onClick={onOpen}>{children}</a>
      <LegalModal isOpen={isOpen} onClose={onClose} tabIndex={1} />
    </>
  )
}

export default TranslationButton

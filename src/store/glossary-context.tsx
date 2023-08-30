import { Context, createContext, useState, useCallback, useMemo, useContext, MouseEvent } from 'react'
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  ModalFooter,
  Text
} from '@chakra-ui/react'
import reactStringReplace from 'react-string-replace'
import glossary from '@/src/data/glossary.json'

interface Glossary {
  [key: string]: string
}

let flatGlossary: Glossary = {}
for (const k in glossary) {
  flatGlossary = {
    ...flatGlossary,
    ...(glossary as any)[k]
  }
}

interface GlossaryContextType {
  showGlossary: (e: MouseEvent, key: string) => void
}

const GlossaryContext: Context<GlossaryContextType> = createContext({
  showGlossary: (e: MouseEvent, key: string): void => {}
})

export function GlossaryContextProvider (props: any): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [key, setKey] = useState<null | string>(null)
  const [value, setValue] = useState<null | string>(null)

  const showGlossary = useCallback((e: MouseEvent, key: string) => {
    e.stopPropagation()
    e.preventDefault()
    const val = flatGlossary[key]
    setKey(key)
    setValue(val)
    onOpen()
  }, [setKey, setValue, onOpen])

  const context = useMemo(() => ({
    showGlossary
  }), [showGlossary])

  return (
    <GlossaryContext.Provider value={context}>
      {props.children}
      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent mr='2' ml='2'>
          <ModalHeader>{key}</ModalHeader>
          <ModalCloseButton onClick={onClose} />
          <ModalBody>
            <Text>{value}</Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </GlossaryContext.Provider>
  )
}

export function GlossaryLink (props: { title: string }): JSX.Element {
  const {
    title
  } = props
  if (title == null) return <>{title}</>
  const { showGlossary } = useContext(GlossaryContext)
  const t = title.replace(/=hb=.*=he=/g, '') // replace help section
  const content = reactStringReplace(t, /=gb=(.*?)=ge=/g, (match, i) => // replace glossary section
    <span className='cursor-pointer underline' key={`${match}-${title}-${i}`} onClick={(e) => showGlossary(e, match)}>{match}</span>
  )
  return <>{content}</>
}

export default GlossaryContext

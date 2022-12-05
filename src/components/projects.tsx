import React, { useEffect, useRef, useState } from 'react'
import PropType from 'prop-types'
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalOverlay,
  useDisclosure,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  Input,
  Text
} from '@chakra-ui/react'
import Link from 'next/link'
import { AiOutlinePlus } from 'react-icons/ai'
import { defaultFetchOptions } from '@/util/api'

const CreateProjectModal = ({ fetchProjects }): JSX.Element => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const inputRef: any = useRef()

  // useEffect(() => {
  //   console.log('inputRef', inputRef)
  //   if (isOpen && inputRef.current != null) inputRef.current.focus()
  // }, [isOpen, inputRef, inputRef.current])

  const handleSubmit = async (e: any): Promise<void> => {
    if (e != null) e.preventDefault()
    if (e.key === 'Enter') await handleCreate()
  }

  const handleCreate = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const data: any = {
        name: inputRef?.current?.value ?? ''
      }

      const response = await fetch('/api/projects', {
        ...defaultFetchOptions,
        method: 'POST',
        body: JSON.stringify(data)
      })

      const inJSON = await response.json()
      console.log('handleCreate', inJSON)
      await fetchProjects()
    } finally {
      onClose()
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={onOpen}
        leftIcon={<AiOutlinePlus />}
        className='background-blue'
        color='white'
        size='lg'
        mt='1rem'
      >
        Create a project
      </Button>
      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              ref={el => {inputRef.current = el; el?.focus();}}
              placeholder='Project name'
              onKeyUp={handleSubmit}
            />
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCreate} isLoading={isLoading} isDisabled={isLoading} loadingText='Creating Project'>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default function Projects (props: any): JSX.Element {
  const { projects = [], fetchProjects }: { projects: any[], fetchProjects: Function } = props

  const loadExistingProjects = (): JSX.Element => {
    return (
      <Box mt='1rem' minWidth='50vw' display='flex' flexWrap='wrap'>
        {projects.map((pr, index) => (
          <Link
            key={index}
            href={{
              pathname: '/projects/[slug]',
              query: { slug: pr._id }
            }}
          >
            <Box
              mr='1rem'
              mt='1rem'
              height='150px'
              width='150px'
              background={`linear-gradient(
                rgba(0, 0, 0, 0.4),
                rgba(0, 0, 0, 0.4)
              ),
              url(${pr.backgroundImage})`}
              backgroundPosition='center'
              backgroundRepeat='no-repeat'
              backgroundSize='cover'
              borderRadius='5px'
              boxShadow='lg'
              cursor='pointer'
            >
              <Text
                marginTop='calc(50% - 25px)'
                height='25px'
                textAlign='center'
                textTransform='capitalize'
                color='white'
                fontSize='20px'
                fontWeight='bold'
              >
                {pr.name}
              </Text>
            </Box>
          </Link>
        ))}
      </Box>
    )
  }

  return (
    <Box flexGrow={3} mx='2%' boxShadow='base' rounded='lg' bg='white' p='1rem'>
      <CreateProjectModal fetchProjects={fetchProjects} />
      {loadExistingProjects()}
    </Box>
  )
}

Projects.propTypes = {
  projects: PropType.array,
  session: PropType.object,
  fetchProjects: PropType.func
}

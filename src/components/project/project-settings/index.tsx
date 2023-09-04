import React, { createContext, useState, useContext, useEffect } from 'react'
import {
  Button,
  Input,
  Box,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  ModalContent,
  FormControl,
  FormLabel,
  FormHelperText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Textarea
} from '@chakra-ui/react'
import { AiFillSetting, AiOutlineDelete, AiOutlineCheck } from 'react-icons/ai'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import Roles from './roles'
import Team from './team'
import { defaultFetchOptions, HTTP_METHODS } from '@/util/api'
import ConfirmDialog from '../../confirm-dialog'
import isEmpty from 'lodash.isempty'
import ToastContext from '@/src/store/toast-context'
import { Project } from '@/src/types/project'
import industries from '@/src/data/industries.json'
import { Industry } from '@/src/types/industry'
import IndustrySelect from '@/src/components/industry-select'

const ProjectBaseProperties = ({ project }: { project: Project }): JSX.Element => {
  const { t } = useTranslation()
  const { isBusy, setIsBusy } = useContext(ProjectSettingsContext)
  const { showToast } = useContext(ToastContext)
  const [projectName, setProjectName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [industry, setIndustry] = useState<Industry | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsBusy(isLoading)
  }, [isLoading])

  const handleSave = async (): Promise<void> => {
    setIsLoading(true)
    const data: Partial<Project> = {}

    if (projectName !== project.name) data.name = projectName
    if (description !== project.description) data.description = description
    if (industry?._id !== project.industryId) data.industryId = industry?._id
    if (!isEmpty(data)) {
      const url = `/api/projects/${String(project._id)}`
      const response = await fetch(url, {
        ...defaultFetchOptions,
        method: HTTP_METHODS.PATCH,
        body: JSON.stringify(data)
      })
      if (response.ok) {
        project.name = projectName
        project.description = description
        project.industryId = industry?._id
        showToast({ title: t('project-settings:success'), description: t('project-settings:success-save-message') })
      } else {
        showToast({ title: t('exceptions:error'), description: t('exceptions:something-went-wrong'), status: 'error' })
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (project.industryId != null) {
      const industry = industries.find(i => i._id === project.industryId)
      setIndustry(industry)
    }
  }, [project.industryId])

  return (
    <>
      <FormControl id='name'>
        <FormLabel>{t('project-settings:project-name')}</FormLabel>
        <Input
          value={projectName}
          onChange={(e) => (setProjectName(e.target.value))}
        />
        <FormHelperText>{t('project-settings:can-change-anytime')}</FormHelperText>
      </FormControl>
      <FormControl id='description' mt='1.5'>
        <FormLabel>{t('project-settings:project-description')}</FormLabel>
        <Textarea
          value={description}
          onChange={(e) => (setDescription(e.target.value))}
        />
      </FormControl>
      <FormControl id='description' my='1.5'>
        <FormLabel>{t('project-settings:project-industry')}</FormLabel>
        <IndustrySelect onSelect={(i) => setIndustry(i)} initialValue={industry} />
      </FormControl>
      <Box>
        <Button
          backgroundColor='success'
          color='white'
          onClick={() => { void handleSave() }}
          disabled={isLoading || projectName == null || projectName === '' || isBusy}
          isLoading={isLoading}
        >
          <AiOutlineCheck /> &nbsp; {t('buttons:save')}
        </Button>
      </Box>
    </>
  )
}

const DeleteProject = ({ project }: { project: Project }): JSX.Element => {
  const { t } = useTranslation()
  const { isBusy, setIsBusy } = useContext(ProjectSettingsContext)
  const [isLoading, setIsLoading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()

  useEffect(() => {
    setIsBusy(isLoading)
  }, [isLoading])

  const handleDelete = async (): Promise<void> => {
    setIsLoading(true)
    const url = `/api/projects/${String(project._id)}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.DELETE
    })
    if (response.ok) {
      await router.push('/projects')
    }
    setIsLoading(false)
  }
  return (
    <>
      <Text as='b'>{t('project-settings:danger-zone')}</Text>
      <Flex justifyContent='space-between' alignItems='center'>
        <p>{t('project-settings:delete-project-caption')}</p>
        <Box>
          <Button
            bg='red.500'
            color='white'
            onClick={onOpen}
            _hover={{
              backgroundColor: 'red.600'
            }}
            isLoading={isLoading}
            isDisabled={isLoading || isBusy}
            loadingText={`${t('buttons:deleting')}`}
          >
            <AiOutlineDelete /> &nbsp;{t('buttons:delete')}
          </Button>
        </Box>
        <ConfirmDialog isOpen={isOpen} onClose={onClose} confirmHandler={handleDelete} />
      </Flex>
    </>
  )
}

interface PropsContext {
  isBusy: boolean
  setIsBusy: Function
}

export const ProjectSettingsContext = createContext<PropsContext>({
  isBusy: false,
  setIsBusy: () => {}
})

export function ProjectSettingsContextProvider (props: any): JSX.Element {
  const [isBusy, setIsBusy] = useState<boolean>(false)

  const context = {
    isBusy,
    setIsBusy
  }

  return (
    <ProjectSettingsContext.Provider value={context}>
      {props.children}
    </ProjectSettingsContext.Provider>
  )
}

const ProjectSettings = ({ project }: { project: Project }): JSX.Element => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isBusy } = useContext(ProjectSettingsContext)

  return (
    <>
      <Button onClick={onOpen} size='xs' as={Button} m='5px' disabled={isBusy}>
        <AiFillSetting />
      </Button>
      <Modal onClose={onClose} isOpen={isOpen} size='xl' isCentered scrollBehavior='inside' closeOnOverlayClick={!isBusy} closeOnEsc={!isBusy}>
        <ModalOverlay />
        <ModalContent height={['100vh', '60vh']} minWidth='370px' mr='2' ml='2'>
          <ModalHeader>{t('project-settings:project-settings')}</ModalHeader>
          <ModalCloseButton disabled={isBusy} />
          <ModalBody overflowY='scroll'>
            <Tabs isFitted variant='enclosed' defaultIndex={0}>
              <TabList mb='2rem'>
                <Tab _focus={{ boxShadow: 'none' }}>{t('project-settings:general')}</Tab>
                <Tab _focus={{ boxShadow: 'none' }}>{t('project-settings:team')}</Tab>
                <Tab _focus={{ boxShadow: 'none' }}>{t('project-settings:roles')}</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <ProjectBaseProperties project={project} />
                  <hr className='my-3' />
                  <DeleteProject project={project} />
                </TabPanel>
                <TabPanel>
                  <Team project={project} />
                </TabPanel>
                <TabPanel>
                  <Roles project={project} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </>
  )
}

export default ProjectSettings

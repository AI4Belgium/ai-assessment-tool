import { Divider, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import { useTranslation, Trans } from 'next-i18next'

interface Props {
  isOpen: boolean
  onClose: () => void
  tabIndex?: number
}

export const LegalModal = ({ isOpen, onClose, tabIndex = 0 }: Props): JSX.Element => {
  const { t } = useTranslation(['terms-and-conditions', 'privacy-policy'])
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior='inside' size={['full', 'full', '2xl', '4xl']}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Terms & Conditions and Privacy Policy</ModalHeader>
          <ModalCloseButton onClick={onClose} />
          <ModalBody>
            <Tabs isFitted variant='enclosed' index={tabIndex}>
              <TabList mb='1em'>
                <Tab>Terms & Conditions</Tab>
                <Tab>Privacy Policy</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Trans
                    t={t}
                    components={{
                      0: <strong key='0' className='underline' />,
                      1: <div key='1' className='text-center' />,
                      title: <div className='text-xl font-bold mb-3 mt-3' />,
                      titleSub: <div className='text-lg' />,
                      listitem: <li className='ml-3 list-inside' />,
                      unordedlist: <ul className='list-disc' />,
                      licence: <div className='ml-9 whitespace-pre-line' />
                    }}
                    className='whitespace-pre-line'
                  >
                    {t('terms-and-conditions:content', { joinArrays: '\n' })}
                  </Trans>
                </TabPanel>
                <TabPanel className='whitespace-pre-line'>
                  <Trans
                    t={t}
                    components={{
                      0: <strong key='0' className='underline' />,
                      1: <div key='1' className='text-center' />,
                      title: <div className='text-xl font-bold mb-3 mt-3' />,
                      titleSub: <div className='text-lg' />,
                      table: <table className='table-auto w-full' />,
                      tr: <tr className='border' />,
                      th: <th className='border p-2' />,
                      td: <td className='border p-2' />,
                      a: <LinkTranslation />
                    }}
                    className='whitespace-pre-line'
                  >
                    {t('privacy-policy:content', { joinArrays: '\n' })}
                  </Trans>
                </TabPanel>
              </TabPanels>
            </Tabs>
            <Divider />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export const LinkTranslation = (props: any): JSX.Element => {
  return (
    <a href={String(props.children)} className={props.className ?? ''}>
      {props.children}
    </a>
  )
}

export default LegalModal

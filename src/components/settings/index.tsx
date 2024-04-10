import React from 'react'
import { Tabs, TabList, Tab, TabPanels, TabPanel, Center } from '@chakra-ui/react'
import PasswordSettings from '@/src/components/settings/password'
import Profile from '@/src/components/settings/profile'
import Email from '@/src/components/settings/email'
import NotificationSettings from './notification'
import { useTranslation } from 'next-i18next'
import DeleteAccountSettings from './delete-account'
import styles from './index.module.css'

const Settings = ({ autoDeleteAccount }: { autoDeleteAccount: boolean }): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Tabs m='3' maxW={['90vw', '100%']} size='sm' variant='enclosed'>
      <TabList className={styles.tablist} overflowX='scroll'>
        <Tab outline='none'>{t('settings:profile')}</Tab>
        <Tab outline='none'>{t('settings:password')}</Tab>
        <Tab outline='none'>{t('settings:email')}</Tab>
        <Tab outline='none'>{t('settings:notifications')}</Tab>
        <Tab outline='none'>{t('settings:delete-account')}</Tab>
      </TabList>
      <Center maxW={['90vw', 500]}>
        <TabPanels boxShadow={0}>
          <TabPanel>
            <Profile />
          </TabPanel>
          <TabPanel>
            <PasswordSettings />
          </TabPanel>
          <TabPanel>
            <Email />
          </TabPanel>
          <TabPanel>
            <NotificationSettings />
          </TabPanel>
          <TabPanel>
            <DeleteAccountSettings autoDeleteAccount={autoDeleteAccount} />
          </TabPanel>
        </TabPanels>
      </Center>
    </Tabs>
  )
}

export default Settings

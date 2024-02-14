import React, { ReactNode } from 'react'
import { Box, Flex, Image, Button, useColorModeValue, VisuallyHidden } from '@chakra-ui/react'
import { FaGithub } from 'react-icons/fa'
import { useTranslation, Trans } from 'next-i18next'

import AppLogo from '@/src/components/app-logo'
import { TextBody } from '@/src/components/front-page/content'
import { GITHUB_URL } from '@/src/components/front-page/header'
import LegalCookieButton from '@/src/components/cookie-consent/legal-cookie-button'
import ManageCookieButton from '@/src/components/cookie-consent/manage-cookie-button'

const Logo = (): JSX.Element => {
  return (
    <Flex className='px-3 py-5 font-semibold text-lg cursor-pointer' alignItems='center'>
      <a href='https://bosa.belgium.be' title='BOSA home page'>
        <Image src='/frontpage/bosa-logo.svg' alt='BOSA logo' height='30px' mr='2vh' />
      </a>
      <a href='https://ai4belgium.be' title='AI 4 Belgium home page' style={{ textDecoration: 'none' }}>
        <AppLogo />
      </a>
    </Flex>
  )
}

const SocialButton = ({ children, label, href }: { children: ReactNode, label: string, href: string }): JSX.Element => {
  return (
    <Button
      bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
      rounded='full'
      w={16}
      h={16}
      cursor='pointer'
      as='a'
      href={href}
      display='inline-flex'
      alignItems='center'
      justifyContent='center'
      transition='background 0.3s ease'
      variant='outline'
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </Button>
  )
}

export const Footer = (): JSX.Element => {
  const { t } = useTranslation(['front-page', 'terms-and-conditions', 'privacy-policy', 'cookies'])
  return (
    <Flex flexDirection='column' bgColor='transparent' pb='30%' mt='3em' alignItems='center'>
      <Logo />
      <TextBody textAlign='center' mt='0'>
        <Trans components={[
          <a href='https://michel.belgium.be/cellule-strat%C3%A9gique-et-secr%C3%A9tariat' key='0' />,
          <a href='https://desutter.belgium.be/contact' key='1' />
        ]}
        >
          {t('footer.txt')}
        </Trans>
      </TextBody>
      <Box mt='1em' />
      <SocialButton label='GitHub' href={GITHUB_URL}>
        <FaGithub />
      </SocialButton>
      <div className='flex flex-wrap underline mt-3 justify-center'>
        <LegalCookieButton index={0}><Box className='mr-2 mb-2 cursor-pointer'>{t('terms-and-conditions:title')}</Box></LegalCookieButton>
        <LegalCookieButton><Box className='mr-2 mb-2 cursor-pointer'>{t('privacy-policy:title')}</Box></LegalCookieButton>
        <ManageCookieButton><Box className='mr-2 mb-2 cursor-pointer'>{t('cookies:cookieActions.configureCookies')}</Box></ManageCookieButton>
      </div>
    </Flex>
  )
}

import React, { ReactNode } from 'react'
import { Box, Flex, Image, Button, useColorModeValue, VisuallyHidden } from '@chakra-ui/react'
import { FaGithub } from 'react-icons/fa'
import { AI4BelgiumIcon } from '@/src/components/navbar'
import { TextBody } from './content'

const Logo = (): JSX.Element => {
  return (
    <Flex className='px-3 py-5 font-semibold text-lg cursor-pointer' alignItems='center'>
      <a href='https://bosa.belgium.be' target='_blank' rel='noreferrer'>
        <Image src='/frontpage/bosa-logo.svg' alt='BOSA logo' height='30px' mr='2vh' />
      </a>
      <a href='https://ai4belgium.be' target='_blank' rel='noreferrer' style={{ textDecoration: 'none' }}>
        <AI4BelgiumIcon />
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
  return (
    <Flex flexDirection='column' bgColor='transparent' pb='30%' mt='3em' alignItems='center'>
      <Logo />
      <TextBody textAlign='center' mt='0'>With the support of <a href='https://michel.belgium.be/fr/cellule-strat%C3%A9gique-et-secr%C3%A9tariat' target='blank'>cabinet Michel</a> and <a href='https://desutter.belgium.be/fr/contact' target='blank'>cabinet De Sutter</a>.</TextBody>
      <Box mt='1em' />
      <SocialButton label='GitHub' href='https://github.com/ai4be/AI-Assessment-Tool'>
        <FaGithub />
      </SocialButton>
    </Flex>
  )
}

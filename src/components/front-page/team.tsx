import React from 'react'
import { Box, Center, Flex, BoxProps } from '@chakra-ui/react'
import style from './team.module.scss'
import { Heading1, TEXT_COLOR } from './content'
import { useTranslation, Trans } from 'next-i18next'

const teamMemberData = [
  {
    src: '/frontpage/avatars/nathalie-smuha.jpeg',
    name: 'Nathalie Smuha',
    social: 'https://www.linkedin.com/in/nathalie-smuha-2aa0b071/'
  },
  {
    src: '/frontpage/avatars/nele-roekens.jpeg',
    name: 'Nele Roekens',
    social: 'https://www.linkedin.com/in/nele-roekens-ab127573/'
  },
  {
    src: '/frontpage/avatars/jelle-hoedmaekers.jpeg',
    name: 'Jelle Hoedemaekers',
    social: 'https://www.linkedin.com/in/jelle-hoedemaekers-0478895a/'
  },
  {
    src: '/frontpage/avatars/carl-morch.jpeg',
    name: 'Carl Mörch',
    social: 'https://www.linkedin.com/in/carl-maria-m%C3%B6rch-99429976/'
  },
  {
    src: '/frontpage/avatars/rob-heyman.png',
    name: 'Rob Heyman',
    social: 'https://www.linkedin.com/in/rob-heyman-7182976/'
  },
  {
    src: '/frontpage/avatars/nathanael-ackerman.jpeg',
    name: 'Nathanaël Ackerman',
    social: 'https://www.linkedin.com/in/nathanael-ackerman-4715881/'
  }
]

const TeamMemberAvatarBlock = ({ teamMember: { src, social, name } }: { teamMember: { src: string, social: string, name: string } }): JSX.Element => {
  const { t } = useTranslation('front-page')
  const workTitle = t(`team.members.${name}.workTitle`)
  const quote = t(`team.members.${name}.quote`)
  return (
    <Box className={style.team_member}>
      <figure>
        <img src={src} alt={`${name} - ${workTitle}`} />
        <figcaption><a href={social}>{name}</a>{workTitle}</figcaption>
        <blockquote className='not-safari' style={{ color: TEXT_COLOR }}>
          {quote}
        </blockquote>
      </figure>
    </Box>
  )
}

export const TeamMembersContainer = (props: BoxProps): JSX.Element => {
  const { t } = useTranslation('front-page')
  return (
    <Box py={['2rem']} className={style.team_container} {...props}>
      <Box as='section' position='relative' zIndex='2'>
        <Center>
          <Heading1>
            <Trans
              components={[<span key='0' className='icon-grey-color' />, <sub key='1' style={{ fontSize: '1em', color: '#057A8B' }} />, <span key='2' className='icon-grey-color' />, <span key='3' className='text-base' />]}
            >
              {t('team.title1')}
            </Trans>
          </Heading1>
        </Center>
        <Flex mt='10vh' flexDirection='column' alignItems='center'>
          {teamMemberData.map((tm, i) => <TeamMemberAvatarBlock key={i} teamMember={tm} />)}
        </Flex>
      </Box>
    </Box>
  )
}

import React from 'react'
import { Box, Flex, Text, Center, Image, Wrap, Heading, Spacer, HeadingProps, TextProps } from '@chakra-ui/react'
import Typed from 'typed.js'
import { useTranslation, Trans } from 'next-i18next'

import { TeamMembersContainer } from '@/src/components/front-page/team'
import { AltaiSections } from '@/src/components/front-page/altai-sections'
import { LinkButton } from '@/src/components/front-page/link-button'
import style from '@/src/components/front-page/content.module.scss'
import { GITHUB_URL } from '@/src/components/front-page/header'

export const TEXT_COLOR = '#09181B'

export const Heading1 = (props: HeadingProps): JSX.Element => <Heading fontSize={['1.875rem', '2.5rem']} {...props}>{props.children}</Heading>
export const Heading2 = (props: HeadingProps): JSX.Element => <Heading mt='1.5rem' mb='1rem' fontSize={['1.5625rem', '1.875rem']} color='#00566B' {...props}>{props.children}</Heading>
export const Heading3 = (props: HeadingProps): JSX.Element => <Heading fontSize={['1.25', '1.5625rem']} {...props}>{props.children}</Heading>
export const TextBody = (props: TextProps): JSX.Element => <Text textAlign='justify' fontSize={['1.125rem', '1.25rem']} mt={['1.125rem', '1.25rem']} {...props}>{props.children}</Text>

export const Content = (): JSX.Element => {
  return (
    <Flex flexDirection='column' justifyContent='center' alignItems='center' px={['2em', '3em']} className={style.content}>
      <Part1 />
      <Part2 />
      <Part3 />
      <TeamMembersContainer color={TEXT_COLOR} />
      <AltaiSections color={TEXT_COLOR} />
    </Flex>
  )
}

const Part1 = (): JSX.Element => {
  const { t } = useTranslation('front-page')

  return (
    <Box pb='2rem' color={TEXT_COLOR} textAlign={['center', 'left']} className={style.part1}>
      <Flex className={style.intro} mt='1.5rem' flexWrap='wrap'>
        <TypingEffect texts={[t('part1.title1'), t('part1.title2'), t('part1.title3')]} />
        <Box>
          <Image src='/frontpage/demo1.png' alt='Demo image' height='30vh' width='50vh' />
        </Box>
      </Flex>
      <Box mt='2rem'>
        <TextBody>
          <Trans t={t} components={[<span key='1' className='underline' />]}>
            {t('part1.txt1')}
          </Trans>
        </TextBody>
        <TextBody>
          <Trans t={t} components={[<a href='https://digital-strategy.ec.europa.eu/en/library/assessment-list-trustworthy-artificial-intelligence-altai-self-assessment' key='0' />]}>
            {t('part1.txt2')}
          </Trans>

        </TextBody>
      </Box>
    </Box>
  )
}

const Part2 = (): JSX.Element => {
  const { t } = useTranslation('front-page')
  return (
    <Box py='2rem' color={TEXT_COLOR}>
      <Heading1><Trans t={t}>{t('part2.title1')}</Trans></Heading1>
      <TextBody mt='2.5rem'><Trans t={t}>{t('part2.txt1')}</Trans></TextBody>
      <Heading2><Trans t={t}>{t('part2.title2')}</Trans></Heading2>
      <TextBody><Trans t={t}>{t('part2.txt2')}</Trans></TextBody>
      <Heading2><Trans t={t}>{t('part2.title3')}</Trans></Heading2>
      <TextBody><Trans t={t}>{t('part2.txt3')}</Trans></TextBody>
      <TextBody><Trans t={t}>{t('part2.txt4')}</Trans></TextBody>
      <TextBody>
        <Trans t={t} components={[<span key='0' className='underline font-bold' />]}>
          {t('part2.txt5')}
        </Trans>
      </TextBody>
      <TextBody><Trans t={t}>{t('part2.txt6')}</Trans></TextBody>
      {GITHUB_URL != null &&
        <Center mt='2rem'>
          <LinkButton link={GITHUB_URL} label={t('part2.action1')} />
        </Center>}
    </Box>
  )
}

const Part3 = (): JSX.Element => {
  const { t } = useTranslation('front-page')
  return (
    <Box py='2rem' color={TEXT_COLOR}>
      <Heading2 textAlign='center' textTransform='uppercase'>{t('part3.title1')}</Heading2>
      <Flex flexDirection='column' alignItems='center' pt='1rem'>
        <Image src='/frontpage/demo2.png' alt='Demo image' width='100%' px='2em' />
        <Flex justifyContent='space-between' mt='2rem'>
          <Wrap>
            <Box>
              <TextBody>
                <Trans t={t}>
                  {t('part3.txt1')}
                </Trans>
              </TextBody>
            </Box>
            <Spacer />
          </Wrap>
        </Flex>
      </Flex>
      <Center mt='2rem'>
        <LinkButton link='/login' label={t('part3.action1')} />
      </Center>
    </Box>
  )
}

const TypingEffect = ({ texts }: { texts: string[] }): JSX.Element => {
  const el = React.useRef(null)

  React.useEffect(() => {
    const typed = new Typed(el.current, {
      strings: texts,
      typeSpeed: 110,
      loop: true
    })

    return () => typed.destroy()
  }, [texts])

  return (
    <Box>
      <Heading2 className={style.text_gradient}>
        <span ref={el} />
      </Heading2>
    </Box>
  )
}

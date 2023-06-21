import React from 'react'
import { Box, Flex, Text, Center, Image, Wrap, Heading, Spacer, HeadingProps, TextProps } from '@chakra-ui/react'
import Typed from 'typed.js'
import { TeamMembersContainer } from './team'
import { AltaiSections } from './altai-sections'
import { LinkButton } from './link-button'
// import checkEnvironment from '@/util/check-environment'
// import { WaveBlackToGray, WavePurple, WavesOutline } from './waves'
// import { Waves2 } from '@/src/components/front-page/waves2'
import style from './content.module.scss'

export const TEXT_COLOR = '#09181B'

export const Heading1 = (props: HeadingProps): JSX.Element => <Heading fontSize={['1.875rem', '2.5rem']} {...props}>{props.children}</Heading>
export const Heading2 = (props: HeadingProps): JSX.Element => <Heading mt='1.5rem' mb='1rem' fontSize={['1.5625rem', '1.875rem']} color='#00566B' {...props}>{props.children}</Heading>
export const Heading3 = (props: HeadingProps): JSX.Element => <Heading fontSize={['1.25', '1.5625rem']} {...props}>{props.children}</Heading>
export const TextBody = (props: TextProps): JSX.Element => <Text fontSize={['1.125rem', '1.25rem']} mt={['1.125rem', '1.25rem']} {...props}>{props.children}</Text>

export const Content = (): JSX.Element => {
  return (
    <Flex flexDirection='column' justifyContent='center' alignItems='center' px={['2em', '3em']} className={style.content}>
      <Part1 />
      {/* <WavesOutline /> */}
      <Part2 />
      {/* <WaveBlackToGray /> */}
      {/* <Waves /> */}
      <Part3 />
      {/* <WaveBlackToGray /> */}
      <TeamMembersContainer color={TEXT_COLOR} />
      {/* <WavePurple /> */}
      <AltaiSections color={TEXT_COLOR} />
      {/* <WaveBlackToGray /> */}
    </Flex>
  )
}

const Part1 = (): JSX.Element => {
  return (
    <Box pb='2rem' color={TEXT_COLOR} textAlign={['center', 'left']} className={style.part1}>
      <Flex className={style.intro} mt='1.5rem' flexWrap='wrap'>
        <TypingEffect texts={['ethical?', 'trustworthy?', 'racially unbiased?']} />
        <Box>
          <Image src='/frontpage/demo1.png' alt='Demo image' height='30vh' width='50vh' />
        </Box>
      </Flex>
      <Box mt='2rem'>
        <TextBody>Welcome to our Open Source <span className='underline'>multidisciplinary</span> and <span className='underline'>interactive</span> online tool for assessing the trustworthiness of an organization's AI implementation.</TextBody>
        <TextBody>The tool is based on the <a href='https://digital-strategy.ec.europa.eu/en/library/assessment-list-trustworthy-artificial-intelligence-altai-self-assessment' target='_blank' rel='noreferrer'>ALTAI recommendations</a> published by the European Commission and is designed to help organizations ensure their AI systems are transparent, robust, and trustworthy.</TextBody>
      </Box>
    </Box>
  )
}

// const Waves = (): JSX.Element => {
//   return (
//     <div>
//       <svg className={style.waves} xmlns='http://www.w3.org/2000/svg' xmlnsXlink='http://www.w3.org/1999/xlink' viewBox='0 24 150 28' preserveAspectRatio='none' shape-rendering='auto'>
//         <defs>
//           <path id='gentle-wave' d='M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z' />
//         </defs>
//         <g className={style.parallax}>
//           <use xlinkHref='#gentle-wave' x='48' y='0' fill='hsla(265, 60%, 18%, 0.95)' />
//           <use xlinkHref='#gentle-wave' x='48' y='3' fill='hsl(267deg 50% 11%)' />
//           <use xlinkHref='#gentle-wave' x='48' y='5' fill='rgba(255,255,255,0.3)' />
//           <use xlinkHref='#gentle-wave' x='48' y='7' fill='#fff' />
//         </g>
//       </svg>
//     </div>
//   )
// }

const Part2 = (): JSX.Element => {
  return (
    <Box py='2rem' color={TEXT_COLOR}>
      <Heading1>Highlight Areas of Risk</Heading1>
      <TextBody mt='2.5rem'>In today's fast-paced world, organizations are increasingly adopting AI to streamline operations and improve decision-making. However, AI systems must be developed and <Text as='span'>implemented with caution</Text>, ensuring that they do not compromise fundamental human rights or perpetuate bias and discrimination. Our tool provides a comprehensive assessment of your organization's AI implementation, highlighting areas of strength and areas for improvement.</TextBody>
      <Heading2>Recommendations Report</Heading2>
      <TextBody>You will also receive detailed <Text as='span'>suggestions and guidance</Text> for improving the trustworthiness of your AI system. This will enable you to build and maintain <Text as='span'>trust</Text> with your customers, employees, and other stakeholders, and <Text as='span'>mitigate the risks</Text> associated with AI implementation.</TextBody>
      <Heading2>You are in control</Heading2>
      <TextBody>One of the key benefits of our <Text as='span'>open-source</Text> tool is that it can be <Text as='span'>hosted and fully controlled by your organization</Text>. This means that you can maintain complete ownership and control over your data and assessments.</TextBody>
      <TextBody>Host the tool on your own servers, you can also ensure that the tool <Text as='span'>meets your</Text> organization's specific <Text as='span'>security and privacy requirements</Text>.</TextBody>
      <TextBody><Text as='span' textDecoration='underline' fontWeight='bold'>OPEN-SOURCE</Text>, modify and adapt the tool to fit your <Text as='span'>organization's unique needs</Text>.</TextBody>
      <TextBody>This flexibility and control make our tool an ideal solution for organizations looking to assess the trustworthiness of their AI systems while maintaining full control over their data and assessments.</TextBody>
      <Center mt='2rem'>
        <LinkButton link='https://github.com/ai4be/AI-Assessment-Tool' label='Install it here' />
      </Center>
    </Box>
  )
}

const Part3 = (): JSX.Element => {
  return (
    <Box py='2rem' color={TEXT_COLOR}>
      <Heading2 textAlign='center'>TRY THE DEMO INSTANCE</Heading2>
      <Flex flexDirection='column' alignItems='center' pt='1rem'>
        <Image src='/frontpage/demo2.png' alt='Demo image' width='100%' px='2em' />
        <Flex justifyContent='space-between' mt='2rem'>
          <Wrap>
            <Box>
              <TextBody>The demo instance is a publicly available instance for trying out the AI Ethics Assessment Tool and can be found at <a href='//altai.ai4belgium.be' target='_blank' rel='noreferrer'>altai.ai4belgium.be</a>.

                While projects and accounts on the demo instance are not deleted periodically, you should <strong>not rely</strong> on the demo instance for production use.
                We cannot guarantee that your projects won’t be lost. This is mainly due to the fact that this instance runs on a small virtual machine with limited resources.
                We generally recommend hosting your own instance.
              </TextBody>
            </Box>
            <Spacer />
          </Wrap>
        </Flex>
      </Flex>
      <Center mt='2rem'>
        <LinkButton link='https://altai.ai4belgium.be/login' label='Try it here' />
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
  }, [])

  return (
    <Box>
      <Heading2 className='text-gradient-purple-light-blue'>
        Is your AI <span ref={el} />
      </Heading2>
    </Box>
  )
}

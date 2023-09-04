import React, { useEffect, useState, useRef } from 'react'
import {
  Button,
  Flex,
  Text,
  Textarea,
  Box,
  RadioGroup,
  Radio,
  Stack,
  CheckboxGroup,
  Checkbox,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  BoxProps,
  RadioGroupProps,
  CheckboxGroupProps
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { GiCancel } from 'react-icons/gi'
import { StringOrNumber } from '@chakra-ui/utils'
import { AiOutlineQuestionCircle } from 'react-icons/ai'
import { useTranslation } from 'next-i18next'
import isEmpty from 'lodash.isempty'
import { Question, DisplayQuestion, QuestionType, Answer } from '@/src/types/card'
import { GlossaryLink } from '@/src/store/glossary-context'

interface QuestionHelpProps {
  question: Question
  boxProps?: BoxProps
}

export const QuestionHelp = ({ question, ...boxProps }: QuestionHelpProps): JSX.Element => {
  const [help, setHelp] = useState('')

  useEffect(() => {
    if (question.title != null) {
      const match = question.title.match(/=hb=(.*)=he=/)
      if (match?.[1] != null) {
        const h = match[1].replace(/=br=/g, '<br />').trim()
        setHelp(h)
      }
    }
  }
  , [question.title])

  return (
    <>
      {!isEmpty(help) &&
        <Popover>
          <PopoverTrigger>
            <Box display='inline-block' style={{ display: 'inline-block' }} {...(boxProps ?? {})}>
              <AiOutlineQuestionCircle cursor='pointer' />
            </Box>
          </PopoverTrigger>
          <PopoverContent opacity='1'>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverBody fontSize={['xs', 'xs', 'sm']} opacity={1} dangerouslySetInnerHTML={{ __html: help }} color='var(--chakra-colors-gray-800)' fontWeight='light' />
          </PopoverContent>
        </Popover>}
    </>
  )
}

type QuestionAnswerProps = BoxProps & {
  question: DisplayQuestion
  onChange?: Function
} & (RadioGroupProps | CheckboxGroupProps)

export const QuestionAnswers = ({ question, onChange, ...boxProps }: QuestionAnswerProps): JSX.Element => {
  const [value, setValue] = React.useState<any>(question.responses ?? '')
  const valueHandler = (value: any): void => {
    if (!Array.isArray(value)) value = [value]
    if (Array.isArray(value) && value.length > 1) {
      value = value.filter(v => v !== '')
      value = Array.from(new Set<any>(value))
    }
    setValue(value)
    if (onChange != null) onChange(value)
  }
  if (question.type === QuestionType.RADIO) {
    const radioGroupProps = boxProps as RadioGroupProps
    return (
      <RadioGroup {...radioGroupProps} onChange={valueHandler} value={value[0]} name={question.id}>
        <Stack direction='row' flexWrap='wrap'>
          {question?.answers?.map((a: Answer, idx) => (
            <Radio
              key={idx} value={`${String(idx)}`} disabled={question.enabled !== true} size='sm' fontSize={['xs', 'xs', 'sm']}
              opacity={question.enabled === true ? 1 : 0.5} ml='0' marginInlineStart='0 !important' marginRight='0.5rem !important'
              style={{ marginRight: '0' }}
            >
              <Box display='inline' color='var(--text-grey)'><GlossaryLink key={`glossary-link-${question.id}+${idx}`} title={a?.answer} /></Box>
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
    )
  } else if (question.type === QuestionType.CHECKBOX) {
    const checkoxGroupProps = boxProps as CheckboxGroupProps
    const valueCheck: StringOrNumber[] = (Array.isArray(value) ? value : [value]) as StringOrNumber[]
    return (
      <CheckboxGroup {...checkoxGroupProps} onChange={valueHandler} value={valueCheck}>
        <Stack direction='row' flexWrap='wrap'>
          {question?.answers?.map((a: Answer, idx) => (
            <Checkbox
              size='sm' key={idx} value={`${idx}`} disabled={question.enabled !== true} fontSize={['xs', 'xs', 'sm']}
              opacity={question.enabled === true ? 1 : 0.5} ml='0' marginInlineStart='0 !important' marginInlineEnd='0.5rem'
              style={{ marginRight: '0.5rem' }}
            >
              <Box display='inline' color='var(--text-grey)'><GlossaryLink key={`glossary-link-${question.id}+${idx}`} title={a?.answer} /></Box>
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
    )
  }
  return <></>
}

export const QuestionComp = ({ question, onChange, ...rest }: { question: DisplayQuestion, onChange: Function, [key: string]: any }): JSX.Element => {
  const { t } = useTranslation()
  const router = useRouter()

  const { question: questionId } = router.query
  const element = useRef<HTMLDivElement>(null)
  const [conclusion, setConclusion] = useState(question.conclusion ?? '')
  const [showEditOptions, setShowEditOptions] = useState(false)

  useEffect(() => {
    if (element?.current != null && questionId != null && questionId === question.id) {
      setTimeout(() => element.current?.scrollIntoView({ behavior: 'smooth' }), 400)
    }
  }, [questionId, element?.current])

  const saveHandler = async (): Promise<void> => {
    await onChange(question, null, conclusion.trim())
    setShowEditOptions(false)
  }
  const cancelHandler = (): void => {
    setConclusion(question.conclusion ?? '')
    setShowEditOptions(false)
  }

  return (
    <>
      <Text color='var(--main-blue)' fontSize={['xs', 'sm']} as='b' display='block' opacity={question.enabled === true ? 1 : 0.5} ref={element}>
        {question.TOCnumber as string} <GlossaryLink title={question.title} />
        <QuestionHelp question={question} />
      </Text>
      {question.enabled === false &&
        <Text color='var(--main-blue)' fontSize='xs' as='b' textDecoration='underline' display='block'>
          {question.enabledCondition?.disabledText}
        </Text>}
      <Box pl={[0, 0, '1.5']}>
        <QuestionAnswers question={question} onChange={(value: any) => onChange(question, value)} marginY='1rem' />
        <Text color='var(--main-blue)' fontSize={['xs', 'sm']} as='b' display='block' opacity={question.enabled === true ? 1 : 0.5}>
          Justification
        </Text>
        <Textarea
          disabled={question.enabled !== true}
          placeholder={`${t('placeholders:motivate-answer')}`}
          size='sm'
          fontSize={['xs', 'sm']}
          style={{ resize: 'none' }}
          value={conclusion}
          onChange={(e) => setConclusion(e.target.value)}
          onFocus={() => setShowEditOptions(true)}
          onBlur={() => setTimeout(() => setShowEditOptions(false), 500)} // needed otherwise the save button will not be clickable
        />
        {showEditOptions &&
          <Flex alignItems='center' justifyContent='space-between' mt='1'>
            <Flex alignItems='center'>
              <Button size='sm' colorScheme='blue' disabled={conclusion.trim() === question?.conclusion} onClick={() => { void saveHandler() }}>
                {t('buttons:save')}
              </Button>
              <GiCancel size='20px' color='#286cc3' cursor='pointer' className='ml-1' onClick={cancelHandler} />
            </Flex>
          </Flex>}
      </Box>
    </>
  )
}

export default QuestionComp

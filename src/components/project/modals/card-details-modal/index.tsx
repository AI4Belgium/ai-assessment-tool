import React, { FC, useCallback, useContext, useEffect, useState } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  Box
} from '@chakra-ui/react'
import { defaultFetchOptions, HTTP_METHODS } from '@/util/api'
import { questionEnabler } from '@/util/question'
import { DisplayQuestion, DisplayCard } from '@/src/types/card'
import QuestionAndComments from '@/src/components/project/modals/question-and-comments'
import { Comment } from '@/src/types/comment'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { GlossaryContextProvider, GlossaryLink } from '@/src/store/glossary-context'
import Sidebar from './sidebar'
import isEmpty from 'lodash.isempty'
import ProjectContext from '@/src/store/project-context'
import industries from '@/src/data/industries.json'
import { ExampleByIndustry } from '@/src/types/industry'

const commonProps = {
  _hover: {
    boxShadow: 'none',
    border: 'none'
  },
  _focus: { boxShadow: 'none !important' }
}

const commonProps2 = {
  ...commonProps,
  _expanded: { boxShadow: 'none' }
}

const AccordionItemStyled = (props: { title: string, desc?: string | string[] | JSX.Element[], children?: any }): JSX.Element => {
  const {
    title,
    desc,
    children
  } = props
  return (
    <AccordionItem
      border='none'
      isFocusable={false}
      {...commonProps2}
    >
      <AccordionButton
        display='flex' alignItems='center' boxShadow='none'
        {...commonProps}
      >
        <Text color='var(--main-blue)' fontSize={['xs', 'xs', 'sm']} as='b'>{title}</Text>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel pb={[2, 2, 4]} border='none' fontSize={['xs', 'xs', 'sm']}>
        {!isEmpty(desc) && <Text fontSize={['xs', 'xs', 'sm']}>{desc}</Text>}
        {children}
      </AccordionPanel>
    </AccordionItem>
  )
}

interface Props {
  onClose: () => void
  isOpen: boolean
  card: DisplayCard
}

const CardDetailsModal: FC<Props> = ({ onClose, isOpen, card }) => {
  const { t } = useTranslation()
  const router = useRouter()
  card.userIds = card?.userIds ?? []
  const cardId = String(card._id)
  const projectId = card.projectId
  const { question: questionId, comment: commentId } = router.query
  const [scoredQuestions, setScoredQuestions] = useState<DisplayQuestion[]>([])
  const [unscoredQuestions, setUnscoredQuestions] = useState<DisplayQuestion[]>([])
  const [, setUnscoredQuestionsCollapsed] = useState<boolean>(true)
  const [commentsFetched, setCommentsFetched] = useState<boolean>(false)
  const { project } = useContext(ProjectContext)
  const [exampleByIndustry, setExampleByIndustry] = useState<ExampleByIndustry | undefined>(undefined)

  const fetchComments = useCallback(async (question?: Partial<DisplayQuestion>): Promise<void> => {
    const url = question != null
      ? `/api/projects/${projectId}/cards/${cardId}/questions/${String(question.id)}/comments`
      : `/api/projects/${projectId}/cards/${cardId}/comments`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.GET
    })
    if (response.ok) {
      const comments: Comment[] = await response.json()
      comments.sort((a, b) => +a.createdAt - +b.createdAt).reverse()
      if (question != null) question.comments = comments
      else {
        card.questions.forEach((q: DisplayQuestion) => {
          q.comments = comments.filter(c => c.questionId === q.id)
        })
      }
      setCommentsFetched(true)
    }
  }, [card, setCommentsFetched])

  useEffect(() => {
    let localExample: ExampleByIndustry | undefined
    if (project?.industryId != null) {
      const industry = industries.find(i => i._id === project.industryId)
      if (industry?.examples != null) {
        localExample = industry?.examples.find(e => e.cardOriginalId === card?.originalId) as ExampleByIndustry
      }
    }
    setExampleByIndustry(localExample)
  }, [project?.industryId, card?.originalId])

  useEffect(() => {
    if (card?.dueDate != null && typeof card.dueDate === 'string') card.dueDate = new Date(card.dueDate)
  }, [card, card.dueDate])

  useEffect(() => {
    if (isOpen) void fetchComments()
  }, [isOpen, fetchComments])

  const recalculateEnableing = useCallback(() => {
    if (Array.isArray(card?.questions)) questionEnabler(card?.questions)
  }, [card])

  useEffect(() => {
    recalculateEnableing()
  }, [recalculateEnableing])

  useEffect(() => {
    if (Array.isArray(card?.questions)) {
      setScoredQuestions(card.questions.filter(q => q.isScored === 1 || q.isScored === true))
      setUnscoredQuestions(card.questions.filter(q => q.isScored === 0 || q.isScored === false))
    }
  }, [card.questions])

  useEffect(() => {
    if ((questionId != null || commentId != null) && Array.isArray(unscoredQuestions)) {
      if (questionId != null && unscoredQuestions.find(q => q.id === questionId) != null) {
        setUnscoredQuestionsCollapsed(false)
      } else if (commentId != null) {
        const question = unscoredQuestions.find(q => q.comments?.find(c => c._id === commentId) != null)
        if (question != null) {
          setUnscoredQuestionsCollapsed(false)
        }
      }
    }
  }, [unscoredQuestions, questionId, commentsFetched])

  return (
    <Modal size={['full', 'full', '3xl', '4xl', '6xl']} onClose={onClose} isOpen={isOpen} isCentered>
      <ModalOverlay maxHeight='100%' />
      {/* https://github.com/chakra-ui/chakra-ui/discussions/2676 */}
      <ModalContent maxW='64rem' overflow='hidden' minHeight='50vh' maxHeight={['100dvh', '100dvh', '90vh']} position='relative' px={[0, 0, '2']}>
        <ModalBody p='0' height='100%' display='flex' flexDirection='column' justifyContent='space-between' width='100%' overflowY='scroll' position='relative' overflowX='hidden'>
          <Box display='flex' height='100%'>
            <Box pt='2rem' px={[0, 0, '4']} minW='0'>
              <GlossaryContextProvider>
                <Box ml={[0, 0, '-4']} position='relative'>
                  <Box width='4px' bgColor='var(--main-blue)' borderRightRadius='15px' height='100%' position='absolute' left='0' top='0' />
                  <Text fontSize={[14, 16, 20]} fontWeight='400' px='4'>
                    {card.TOCnumber} <GlossaryLink title={card.title} />
                  </Text>
                </Box>
                {Array.isArray(exampleByIndustry?.data) &&
                  <Accordion allowMultiple>
                    <AccordionItemStyled title={`${t('titles:example')}`}>
                      {exampleByIndustry?.data.map((txt, idx) => <Text key={`example-${card._id}-${idx}`} fontSize={['xs', 'xs', 'sm']}>{txt}</Text>)}
                    </AccordionItemStyled>
                  </Accordion>}

                <Accordion defaultIndex={0} allowToggle borderRadius='lg' className='shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]' border='1px solid var(--main-blue)' marginY='1rem' mx={['5px', '5px', 0]}>
                  <AccordionItem
                    border='none'
                    isFocusable={false}
                    {...commonProps2}
                  >
                    <AccordionButton
                      display='flex' alignItems='center' justifyContent='space-between' boxShadow='none'
                      {...commonProps}
                    >
                      <Text fontSize={[10, 12, 16]} color='var(--text-gray)' fontWeight='200' px='4' display='inline'>
                        The following questions will help you in your evaluation
                      </Text>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4} border='none'>
                      {unscoredQuestions.map((q: DisplayQuestion, index: number) =>
                        <QuestionAndComments key={`${cardId}-${q.id}-${index}`} p={3} question={q} cardId={cardId} projectId={projectId} questionSaveCallback={recalculateEnableing} />)}
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
                {scoredQuestions?.length > 0 &&
                  <Box marginBottom='1rem' borderRadius='lg' className='shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]' border='1px solid var(--main-blue)' paddingY='1rem' mx={['5px', '5px', 0]}>
                    {scoredQuestions.map((q: DisplayQuestion, index: number) =>
                      <QuestionAndComments key={`${cardId}-${q.id}-${index}`} p={3} question={q} cardId={cardId} projectId={projectId} questionSaveCallback={recalculateEnableing} />)}
                  </Box>}
              </GlossaryContextProvider>
            </Box>
            <Sidebar card={card} minWidth={['140px', ' 180px', '241px']} flexBasis='auto' />
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default CardDetailsModal

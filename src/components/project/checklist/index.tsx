import React, { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useTranslation } from 'next-i18next'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import ChecklistTopBar from '@/src/components/project/checklist/top-bar'
import { Project, Category, Section } from '@/src/types/project'
import CategoryQuestions from '@/src/components/project/checklist/category-questions'
import OverviewComponent from '@/src/components/project/checklist/overview'
import RadarChart from '@/src/components/project/checklist/radar-chart'
import { fetcher } from '@/util/api'
import { QueryFilterKeys } from '@/src/components/project/project-bar/filter-menu'
import isEmpty from 'lodash.isempty'
import { setQuestionCleanTitle } from '@/util/question'
import { Answer, Card, Question, QuestionType } from '@/src/types/card'

interface Props {
  project: Project
  categories: Category[]
  sections: Section[]
}

const isSectionCard = (card: Card, cat: Category, sec?: Section): boolean => {
  let val = card.category === cat._id && card.questions.some(q => q.isScored) // show only scored questions
  if (sec != null) val = val && card.section === sec.id
  return val
}

const PLACEHOLDER_SECTION_ID = 'placeholder-section-id'

const Checklist: FC<Props> = ({ project, categories, sections }): JSX.Element => {
  const { t } = useTranslation()
  const router = useRouter()
  const projectId = String(project?._id)
  const {
    [QueryFilterKeys.CATEGORY]: categoryId
  } = router.query
  const { data: dataCards } = useSWR(`/api/projects/${projectId}/cards`, fetcher)
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(categories)
  const [categoriesToShow, setCategoriesToShow] = useState<Category[]>(categories)
  const [scoredQuestionsPerCategory, setScoredQuestions] = useState<{ [key: string]: Question[] }>({})
  const [normalizedScoredPerCategory, setNormalizedScoredPerCategory] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    if (Array.isArray(categoriesToShow)) {
      const localCategories = categoryId == null
        ? categoriesToShow
        : categoriesToShow.filter((category: Category) => category._id === categoryId)
      setFilteredCategories(localCategories)
      if (categoryId != null && localCategories.length === 0) {
        const query = { ...router.query }
        delete query[QueryFilterKeys.CATEGORY] // eslint-disable-line @typescript-eslint/no-dynamic-delete
        void router.push({ query }, undefined, { shallow: true })
      }
    }
  }, [categoriesToShow, categoryId])

  useEffect(() => {
    const localNormalizedScorePerCategory: { [key: string]: number } = {}
    for (const cat of categories) {
      const catScoredQuestions = scoredQuestionsPerCategory[cat._id]
      if (catScoredQuestions == null || catScoredQuestions.length === 0) {
        localNormalizedScorePerCategory[cat._id] = 0
        continue
      }

      for (const question of catScoredQuestions) {
        const { answers, responses } = question
        let maxQuestionScore: number = 0
        let catScore: number = 0
        if (question.type === QuestionType.CHECKBOX) {
          maxQuestionScore = answers.reduce((acc: number, curr: Answer) => acc + curr.score, 0)
          catScore = responses?.reduce((acc: number, ansIdx: number) => acc + answers[ansIdx].score, 0) ?? 0
        } else if (question.type === QuestionType.RADIO) {
          maxQuestionScore = Math.max(...answers.map(a => a.score))
          catScore = responses != null && responses.length > 0 ? answers[responses[0]].score : 0
        }
        const normalizedScored = maxQuestionScore > 0 ? catScore / maxQuestionScore : 0
        localNormalizedScorePerCategory[cat._id] = normalizedScored
      }
    }
    setNormalizedScoredPerCategory(localNormalizedScorePerCategory)
  }, [scoredQuestionsPerCategory, categories])

  useEffect(() => {
    if (Array.isArray(categories) && Array.isArray(dataCards)) {
      dataCards.forEach(c => c.questions.map((q: Question) => setQuestionCleanTitle(q)))
      const catToShow: Category[] = []
      const localScoredQuestionsPerCategory: { [key: string]: Question[] } = {}
      for (const cat of categories) {
        if (isEmpty(cat.sections)) {
          cat.sections = [{
            _id: PLACEHOLDER_SECTION_ID,
            id: PLACEHOLDER_SECTION_ID,
            title: '',
            cards: dataCards.filter((card: Card) => isSectionCard(card, cat))
          }]
        } else {
          for (const section of cat.sections) {
            if (section._id === PLACEHOLDER_SECTION_ID) section.cards = dataCards.filter((card: Card) => isSectionCard(card, cat))
            else section.cards = dataCards.filter((card: Card) => isSectionCard(card, cat, section))
          }
        }
        const cards = cat.sections.map(s => s.cards).flatMap(c => c ?? [])
        const catScoredQuestions = cards.flatMap(c => c.questions).filter(q => q.isScored)
        localScoredQuestionsPerCategory[cat._id] = catScoredQuestions
        if (cards.length > 0) catToShow.push(cat)
      }
      setCategoriesToShow(catToShow)
      setScoredQuestions(localScoredQuestionsPerCategory)
    }
  }, [categories, dataCards])

  return (
    <Box backgroundColor='white' padding='2rem' paddingTop='1rem' borderRadius='1rem' className='print:p-0'>
      <Flex justifyContent='flex-end' className='print:hidden'>
        <Button size={['xs', 'sm', 'md']} backgroundColor='#2811ED' color='white' onClick={() => window?.print()}>{t('buttons:export')}</Button>
      </Flex>
      <Text color='#1C1E20' fontSize='18px' className='hidden print:block'>1. Overview</Text>
      <OverviewComponent categories={categoriesToShow} scoresPerCatId={normalizedScoredPerCategory} />
      <Text color='#1C1E20' fontSize='18px' className='hidden print:block' marginTop='1rem'>2. Assessment</Text>
      <RadarChart categories={categoriesToShow} scoresPerCatId={normalizedScoredPerCategory} />
      <ChecklistTopBar categories={categoriesToShow} />
      <Box className='hidden print:block break-before-page' />
      <CategoryQuestions project={project} categories={filteredCategories} marginTop='1rem' cards={dataCards} />
    </Box>
  )
}

export default Checklist

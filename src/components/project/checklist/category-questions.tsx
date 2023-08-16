import React, { FC, Fragment } from 'react'
import {
  Box,
  Divider,
  Text,
  BoxProps,
  Grid,
  GridItem,
  useDisclosure
} from '@chakra-ui/react'
import { Card, DisplayQuestion, Question } from '@/src/types/card'
import { Category, Project } from '@/src/types/project'
import { isEmpty } from '@/util/index'
import { useQueryCardId } from '@/src/hooks/index'
import CardDetailsModal from '@/src/components/project/modals/card-details-modal'

type Props = {
  project: Project
  categories: Category[]
  cards: Card[]
} & BoxProps

const CategoryQuestions: FC<Props> = ({ project, categories, cards, ...boxProps }): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { card, setCardQuery, unSetCardQuery } = useQueryCardId(cards, () => onOpen(), () => onClose())

  return (
    <Box backgroundColor='white' {...boxProps}>
      {Array.isArray(categories) && categories.map(category =>
        <Box key={category._id} className='break-after-page last:break-after-avoid'>
          <Text fontSize={['l', 'l', 'xl']} textTransform='uppercase' fontWeight='semibold' marginBottom={['0.5rem', '0.5rem', '1rem']}>
            {category?.name}
          </Text>
          <Box display='flex' flexDirection='column'>
            {category.sections?.map((section, idx) =>
              <Grid templateColumns='min-content auto 8rem' key={`${category._id}-${section.id ?? idx}`} _last={{ marginBottom: '1rem' }} alignItems='center'>
                {!isEmpty(section.title) && <GridItem colSpan={3} marginTop={idx !== 0 ? '1rem' : '0'}><Text textTransform='uppercase' color='var(--primary-color)' fontSize={['sm', 'sm', 'md']} marginBottom={['0.5rem', '0.5rem', '1rem']} marginLeft='1rem'>{section.title}</Text></GridItem>}
                {section.cards?.map((c, idxc, cards) => c.questions.filter((q: Question) => q.isScored).map((q: Question, idxq, questions) =>
                  <Fragment key={q.id}>
                    {(idxq !== 0 || idxc !== 0) && <><GridItem colSpan={1} height='3rem' justifySelf='center' paddingY='0.5rem' className='print:pt-0'><Divider orientation='vertical' height='100%' color='#9f9e9f' /></GridItem><GridItem colSpan={2} /></>}
                    <GridItem colSpan={1}>
                      <Box height='2rem' width='2rem' borderRadius='full' backgroundColor='var(--secondary-color)' className='print:background' />
                    </GridItem>
                    <GridItem colSpan={1} paddingLeft='1rem' onClick={() => { void setCardQuery(c._id, q.id) }} cursor='pointer'>
                      <Text fontWeight='semibold' fontSize={['xs', 'xs', 'sm']} cursor='pointer'>{(q as DisplayQuestion).cleanTitle}</Text>
                    </GridItem>
                    <GridItem colSpan={1}>
                      <Text fontWeight='semibold' fontSize={['xs', 'xs', 'sm']} color='var(--primary-color)' textAlign='center' onClick={() => { void setCardQuery(c._id, q.id) }} cursor='pointer'>
                        {Array.isArray(q.responses) && !isEmpty(q.responses) ? q.answers[q.responses[0]].answer : '-'}
                      </Text>
                    </GridItem>
                    <GridItem colSpan={1} height='100%' justifySelf='center' paddingTop='0.5rem' className='hidden print:block'>
                      {/* {idxq} {questions.length - 1} {idxc} {cards.length - 1} {idxq !== (questions.length - 1) && idxc !== (cards.length - 1) ? 'true' : 'false'} */}
                      {(idxq !== (questions.length - 1) || idxc !== (cards.length - 1)) && <Divider orientation='vertical' height='100%' color='#9f9e9f' />}
                    </GridItem>
                    <GridItem colSpan={1} paddingLeft='1rem' className='hidden print:block'>
                      <Text fontSize='sm' color='#2811ED' fontWeight='700' marginTop='1.5rem' marginBottom='1rem'>
                        Justification
                      </Text>
                      <Text color='#25282B' paddingLeft='1rem'>
                        {q.conclusion}
                      </Text>
                    </GridItem>
                    <GridItem colSpan={1} className='hidden print:block' />
                  </Fragment>
                ))}
              </Grid>)}
          </Box>
        </Box>)}
      {card != null && <CardDetailsModal isOpen={isOpen} onClose={unSetCardQuery as any} card={card} />}
    </Box>
  )
}

export default CategoryQuestions

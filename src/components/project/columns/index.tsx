import React, { useState, FC, useEffect } from 'react'
import { Box, useDisclosure } from '@chakra-ui/react'
import CardDetailsModal from '@/src/components/project/modals/card-details-modal/index'
import ColumnComponent from '@/src/components/project/columns/column'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import useSWR from 'swr'
import { updateCard } from '@/util/cards'
import { fetcher } from '@/util/api'
import { useRouter } from 'next/router'
import ProjectBar from '@/src/components/project/project-bar'
import { CardStage, Card } from '@/src/types/card'
import isEmpty from 'lodash.isempty'
import { Assignment, DueDate, QueryFilterKeys } from '../project-bar/filter-menu'
import { Column } from '@/src/types/column'
import { useQueryCardId } from '@/src/hooks/index'
import { Project } from '@/src/types/project'
import { useTranslation } from 'next-i18next'

// ugly hack to get around typescript issues
const DragDropContext2 = DragDropContext as any
const Droppable2 = Droppable as any

interface IProps {
  project: Project
  isLoading?: boolean
}

// defined to avoid style issues while columns are loading
const dummyData = { projectId: '', createdAt: new Date(), createdBy: '' }

const colWidth = '272'

const ProjectColumns: FC<IProps> = ({ project, isLoading: isLoadingProject = false }): JSX.Element => {
  const { t } = useTranslation()
  const defaultColumns: Column[] = [
    { _id: '1', name: `${t('column-dashboard:todo')}`, ...dummyData },
    { _id: '2', name: `${t('column-dashboard:busy')}`, ...dummyData },
    { _id: '3', name: `${t('column-dashboard:done')}`, ...dummyData }
  ]
  const router = useRouter()
  const projectId = String(project?._id)
  const {
    [QueryFilterKeys.CATEGORY]: categoryId,
    [QueryFilterKeys.STAGE]: stage,
    [QueryFilterKeys.ASSIGNED_TO]: assignedTo,
    [QueryFilterKeys.DUE_DATE]: dueDate,
    [QueryFilterKeys.ASSIGNMENT]: assignment
  } = router.query
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { data, isLoading: isLoadingColumns } = useSWR(`/api/projects/${projectId}/columns`, fetcher)
  const { data: dataCards, isLoading: isLoadingCards } = useSWR(`/api/projects/${projectId}/cards`, fetcher)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [columns, setColumns] = useState<Column[]>(defaultColumns)
  const [cards, setCards] = useState<Card[]>([])
  const { card, setCardQuery, unSetCardQuery } = useQueryCardId(cards, () => onOpen(), () => onClose())

  // useRenderingTrace('ProjectColumns', { projectId, session, columns, cards, isLoading, cardDetail }, 'log')

  useEffect(() => {
    setIsLoading(isLoadingColumns || isLoadingCards || isLoadingProject)
  }, [isLoadingColumns, isLoadingCards, isLoadingProject])

  useEffect(() => {
    if (Array.isArray(data)) {
      setColumnsSorted(data)
    } else {
      setColumns(defaultColumns)
    }
  }, [data])

  useEffect(() => {
    if (Array.isArray(dataCards)) {
      dataCards.forEach(card => {
        if (card?.dueDate != null && typeof card.dueDate === 'string') card.dueDate = new Date(card.dueDate)
      })
    }
    setCards(dataCards ?? [])
  }, [dataCards])

  const setColumnsSorted = (cols: any[]): void => {
    cols.sort((a, b) => a.sequence - b.sequence)
    setColumns(cols)
  }

  const filterCardsArrayFn = (card: any, columnId: string): boolean => {
    let val = String(card.columnId) === columnId
    const queryStage = String(stage).toLowerCase()
    if (val && categoryId != null) val = card.category === categoryId
    if (val && stage != null) {
      val = card.stage?.toLowerCase() === queryStage || (queryStage === CardStage.DEVELOPMENT && isEmpty(card.stage))
    }
    if (val && assignedTo != null && assignedTo?.length > 0) {
      const fileterUserIds = typeof assignedTo === 'string' ? [assignedTo] : assignedTo
      const assignedToArr = card.userIds?.map((uid: string) => uid) ?? []
      val = fileterUserIds.some(uid => assignedToArr.includes(uid))
    }
    if (val && dueDate != null) {
      val = dueDate === DueDate.NOT_SET ? isEmpty(card.dueDate) : !isEmpty(card.dueDate)
    }
    if (val && assignment != null && assignment !== Assignment.ASSIGNED_TO) {
      val = assignment === Assignment.UNASSIGNED ? isEmpty(card.userIds) : !isEmpty(card.userIds)
    }
    return val
  }

  const filterCards = (columnId: string): any[] => {
    columnId = String(columnId)
    return cards.filter(card => filterCardsArrayFn(card, columnId))
  }

  const onDragEnd = async (result: any): Promise<void> => {
    const { destination, source, draggableId, type } = result
    // Don't do anything where there is not destination
    if (destination == null) return
    // Do nothing if the card is put back where it was
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    // If card is being dragged
    if (type === 'card') {
      return await saveCardSequence(destination.index, destination.droppableId, draggableId)
    }
  }

  const saveCardSequence = async (destinationIndex: number, destinationColumnId: string, cardId: string): Promise<void> => {
    const cardsFromColumn: Card[] = cards.filter(
      (card) => card.columnId === destinationColumnId && card._id !== cardId
    )
    const sortedCardsFromColumn = cardsFromColumn.sort((a, b) => a.sequence - b.sequence)
    let sequence = +(destinationIndex === 0 ? 1 : sortedCardsFromColumn[destinationIndex - 1].sequence + 1)

    const patchCard: any = {
      _id: cardId,
      sequence
    }
    const cardToPatch: any = cards.find(card => card._id === cardId)
    if (cardToPatch == null) return
    cardToPatch.sequence = sequence
    if (String(cardToPatch.columnId) !== String(destinationColumnId)) {
      cardToPatch.columnId = destinationColumnId
      patchCard.columnId = destinationColumnId
    }
    const promises: Array<Promise<any>> = [updateCard(patchCard, String(project?._id))]
    for (const card of sortedCardsFromColumn) {
      sequence += 1
      card.sequence = sequence

      const patchCard = {
        _id: card._id,
        sequence
      }
      promises.push(updateCard(patchCard, String(project?._id)))
    }
    setCards([...cards])
    await Promise.all(promises)
    // await mutateCards()
  }

  return (
    <Box width='100%' maxWidth={['100vw', '100vw', 'unset']}>
      <ProjectBar project={project} ml={['30px', '30px', '0']} />
      <DragDropContext2 onDragEnd={onDragEnd}>
        <Droppable2 droppableId='all-collumns' direction='horizontal' type='column'>
          {(provided: any) => (
            <Box
              width='100%'
              ref={provided.innerRef}
              {...provided.droppableProps}
              display='flex'
              overflowX={['scroll', 'scroll', 'hidden']}
              flexWrap='nowrap'
              flexShrink='1 0 auto'
              scrollSnapType={['x mandatory', 'x mandatory', 'none']}
              pt={[0, 0, '5px']}
            >
              {Array.isArray(columns) && columns.map((column, index) => (
                <ColumnComponent
                  key={column._id}
                  column={column}
                  id={column._id}
                  index={index}
                  ml={index === 0 ? '10px' : '5px'}
                  mr={index === columns.length - 1 ? '10px' : '5px'}
                  cards={filterCards(column._id)}
                  showCardDetail={setCardQuery}
                  projectId={String(project?._id)}
                  minW={['calc(100vw - 20px)', 'calc(100vw - 20px)', 'unset']}
                  width={['calc(100vw - 20px)', 'calc(100vw - 20px)', `${colWidth}px`]}
                  scrollSnapAlign={['center', 'center', 'none']}
                  scrollSnapStop={['always', 'always', 'unset']}
                  isLoading={isLoading}
                />
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable2>
      </DragDropContext2>
      {card != null && <CardDetailsModal isOpen={isOpen} onClose={unSetCardQuery as any} card={card} />}
    </Box>
  )
}

export default ProjectColumns

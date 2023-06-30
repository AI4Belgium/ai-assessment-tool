import React, { useState, useCallback, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import {
  Box,
  Heading,
  Input,
  BoxProps
} from '@chakra-ui/react'
import { Droppable } from 'react-beautiful-dnd'
import { debounce } from '@/util/index'
import Card from '@/src/components/project/card'
// import { addCard } from '@/util/cards'
// import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Sort, Order } from '@/src/components/project/project-bar/sort-menu'
import {
  updateColumn
} from '@/util/columns'
import { useTranslation } from 'next-i18next'
import { Card as CardType } from '@/src/types/card'

enum SortKeys {
  NUMBER = 'number',
  DUE_DATE = 'dueDate'
}

const Droppable2 = Droppable as any

function sortCards (cards: any[], sort: Sort, order: Order): any[] {
  let key = SortKeys.NUMBER
  switch (sort) {
    case Sort.DUE_DATA:
      key = SortKeys.DUE_DATE
      break
    default:
      key = SortKeys.NUMBER
  }
  const noValPlaceholder = sort === Sort.NUMBER ? 0 : (order === Order.ASC ? Infinity : -Infinity)

  const copy = [...cards]

  copy.sort((a, b) => {
    let valA = a[key]
    let valB = b[key]
    // backward compatibility hack, get number from title
    if (key === SortKeys.NUMBER && valA == null) {
      valA = +(a.title.match(/^[0-9.]+/))
      valB = +(b.title.match(/^[0-9.]+/))
    }
    valA = valA ?? noValPlaceholder
    valB = valB ?? noValPlaceholder
    if (order === Order.ASC) {
      return +valA - +valB
    } else {
      return +valB - +valA
    }
  })
  return copy
}

interface Props extends BoxProps {
  showCardDetail: (cardId: string) => void | Promise<void>
  column: any
  index: number
  cards: CardType[]
  projectId: string
}

const Column = ({ showCardDetail, column, index, cards, projectId, ...boxProps }: Props): JSX.Element => {
  const { t } = useTranslation()
  // const { data } = useSession()
  const router = useRouter()
  const {
    sort = Sort.NUMBER,
    ord = Order.ASC
  } = router.query
  const [showEditBox, setEditBoxVisibility] = useState<boolean>(false)
  const [, setIsLoading] = useState<boolean>(false)
  const [cardsInSortedSequence, setCardsInSortedSequence] = useState<any[]>(sortCards(cards, sort as Sort, ord as Order))
  const [columnName, setColumnName] = useState<string>(column.name)
  // const user: any = data?.user

  useEffect(() => {
    setCardsInSortedSequence(sortCards(cards ?? [], sort as Sort, ord as Order))
  }, [cards, sort, ord])

  const loadColumnTitle = (): JSX.Element => {
    if (showEditBox) {
      return (
        <Input
          bg='white'
          value={columnName}
          size='xs'
          width='60%'
          ml='20px'
          onChange={handleChange}
          onBlur={() => setEditBoxVisibility(false)}
          onKeyDown={handleKeyDown}
        />
      )
    }

    return (
      <Heading as='h6' size='sm' ml='10px' mt='5px' textAlign='center' className='text-grey uppercase'>
        {t(`column-dashboard:${columnName.replaceAll(' ', '')}`)}
      </Heading>
    )
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setEditBoxVisibility(false)
    }
  }

  const handleChange = (e: ChangeEvent): void => {
    const val = (e.target as any).value
    setColumnName(val)
    handleColumnNameChange(val)
  }

  const handleColumnNameChange = useCallback(
    debounce(async (value: string) => await nameChange(value), 800),
    []
  )

  const nameChange = async (value: string): Promise<void> => {
    setIsLoading(true)
    const data = {
      name: value,
      columnId: column._id,
      projectId
    }
    await updateColumn(data)
    setIsLoading(false)
  }

  return (
    <Box
      key={index}
      height='calc(100vh - 70px)'
      overflowY='auto'
      {...boxProps}
      border='1px solid var(--main-blue)'
      rounded='lg'
      display='flex'
      flexDirection='column'
    >
      <Box display='flex' alignItems='center' justifyContent='center' className='mt-1.5'>
        {loadColumnTitle()}
      </Box>
      <Droppable2 droppableId={column._id} type='card'>
        {(provided: any) => (
          // 2px height is needed to make the drop work when there is no card.
          <Box ref={provided.innerRef} {...provided.droppableProps} flexGrow={1}>
            {cardsInSortedSequence?.map((card, index) => (
              <Card key={index} card={card} cardIndex={index} showCardDetail={showCardDetail} />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable2>
      {/* <Button
        size='xs'
        my='10px'
        mx='auto'
        width='80%'
        color='black'
        variant='ghost'
        disabled={isLoading}
        isLoading={isLoading}
        display='flex'
        loadingText='Adding card'
        onClick={handleCardAdd}
      >
        + Add a card
      </Button> */}
    </Box>
  )
}

export default Column

import React, { FC, useContext, useEffect, useState } from 'react'
import { Box, Badge, Avatar, Text } from '@chakra-ui/react'
import { Draggable } from 'react-beautiful-dnd'
import ProjectContext from '@/src/store/project-context'
import { fetchUsers } from '@/util/users-fe'

interface Props {
  showCardDetail: (cardId: string) => void
  cardIndex: number
  card: any
}

const Card: FC<Props> = ({ cardIndex, showCardDetail, card }) => {
  const projectContext = useContext(ProjectContext)
  const [users, setUsers] = useState<any[]>([])

  useEffect((): void => {
    if (projectContext.project?.users != null) {
      void fetchUsers(projectContext.project?.users).then(usersData => setUsers(usersData))
    } else {
      setUsers((prevValue) => {
        if (prevValue.length === 0) return prevValue
        return []
      })
    }
  }, [projectContext.project?.users])

  const loadAssignedToUser = (): JSX.Element => {
    if (card.assignedTo == null) return <></>

    const user = users.filter((user) => user._id === card.assignedTo)

    return (
      <Box display='flex' justifyContent='flex-end'>
        <Avatar size='xs' name={user[0]?.fullName} />
      </Box>
    )
  }

  return (
    // https://github.com/atlassian/react-beautiful-dnd/issues/1767
    <Draggable draggableId={card._id} index={cardIndex} key={card._id}>
      {(provided) => (
        <Box
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          m='5px'
          p='10px'
          id={card._id}
          minHeight='80px'
          borderWidth='1px'
          bg='white'
          cursor='pointer'
          borderRadius='md'
          overflow='auto'
          _hover={{
            backgroundColor: 'lightblue'
          }}
          onClick={() => showCardDetail(card._id)}
        >
          {(card.label != null) && (
            <Badge bg={card.label.type} color='white'>
              {card.label.type}
            </Badge>
          )}
          <Text fontSize='sm' >{card.title?.replace(/(=g(b|e)=)/g, '')}</Text>
          {loadAssignedToUser()}
        </Box>
      )}
    </Draggable>
  )
}

export default Card

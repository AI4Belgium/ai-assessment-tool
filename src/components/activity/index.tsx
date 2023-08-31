import React, { useEffect, useState, useRef, useContext, ReactNode } from 'react'
import {
  Avatar,
  Box,
  Button,
  Flex,
  Text
} from '@chakra-ui/react'
import Link from 'next/link'
import { DisplayActivity, ActivityType } from '@/src/types/activity'
import style from '@/src/components/activity/index.module.css'
import { format } from 'date-fns'
import { getUserDisplayName } from '@/util/users'
import { isEmpty } from '@/util/index'
import { QuestionType } from '@/src/types/card'
import { useOnScreen } from '@/src/hooks/index'
import UserContext from '@/src/store/user-context'
import { defaultFetchOptions, HTTP_METHODS } from '@/util/api'
import { User } from '@/src/types/user'

const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  const currentDate = new Date()
  const skipYear = d.getFullYear() === currentDate.getFullYear()
  const skipMonth = d.getMonth() === currentDate.getMonth() && d.getDate() === currentDate.getDate()
  let formatExpression = 'H:mm'
  if (skipMonth) return format(d, formatExpression)
  formatExpression += ' d MMM'
  if (skipYear) return format(d, formatExpression)
  formatExpression += ' yyyy'
  return format(d, formatExpression)
}

// const queryObjToQueryString = (query: any): string => {
//   return Object.keys(query).map(k => {
//     if (typeof query[k] === 'object') {
//       return Object.keys(query[k]).map(kk => `${k}[${kk}]=${String(query[k][kk])}`).join('&')
//     }
//     return `${k}=${String(query[k])}`
//   }).join('&')
// }

export const ActivityTimeline = ({ activities = [], total, loadMoreFn }: { activities: DisplayActivity[], total: number, loadMoreFn?: Function }): JSX.Element => {
  return (
    <Box className={style.timeline}>
      {activities.map((activity: DisplayActivity, idx: number) =>
        <TimelineItem key={`${activity._id}-${(new Date(activity.updatedAt ?? 0).toISOString())}`} activity={activity} placement={idx % 2 === 0 ? 'left' : 'right'} />
      )}
      {loadMoreFn != null && total !== activities?.length &&
        <Flex justifyContent='center' position='relative' zIndex='1'>
          <Button onClick={() => loadMoreFn()}>Load more</Button>
        </Flex>}
    </Box>
  )
}

export const TimelineItem = ({ activity, placement }: { activity: DisplayActivity, placement: string }): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null)
  const [promise, setPromise] = useState<null | Promise<any>>(null)
  const [setSeenBy, setSetSeenBy] = useState<boolean>(false)
  const isVisible = useOnScreen(ref)
  const { user } = useContext(UserContext)
  const userId = user?._id
  const isCreator = activity.createdBy === userId
  activity.seenBy = activity.seenBy ?? []
  const isSeen = activity.seenBy.includes(userId) || isCreator

  useEffect(() => {
    if (isVisible && !isSeen && !isCreator && promise == null && !setSeenBy) {
      const url = `/api/activities/${activity._id}/seen`
      const p = fetch(url, {
        ...defaultFetchOptions,
        method: HTTP_METHODS.POST,
        body: JSON.stringify({})
      })
      setPromise(p)
      void p.then(response => {
        if (response.ok) {
          setSetSeenBy(true)
          activity.seenBy = activity.seenBy ?? []
          activity.seenBy.push(userId)
        }
      }).finally(() => setPromise(null))
    }
  }, [isVisible, isSeen, isCreator, promise, setSeenBy])

  return (
    <Box className={`${style.container} ${placement === 'left' ? style.left : style.right} ${isSeen ? '' : style.unSeen}`} ref={ref}>
      <ActivityRenderer displayActivity={activity} />
      <Box className={style.date}>{formatDate(activity.createdAt)}</Box>
    </Box>
  )
}

interface Props {
  activity: DisplayActivity
  cardId?: string
  questionId?: string
  commentId?: string
  children?: ReactNode
}

const ProjectLinkComp = (props: Props): JSX.Element => {
  const {
    activity,
    cardId,
    questionId,
    commentId
  } = props
  const commonContent = (
    <Box className={style.content}>
      <Flex alignItems='center'>
        <Avatar size='xs' name={getUserDisplayName(activity.creator)} src={activity.creator.xsAvatar} />
        <Text ml='1' as='b' fontSize='sm'>{getUserDisplayName(activity.creator)}</Text>
      </Flex>
      &nbsp;
      {props.children}
    </Box>
  )
  if (activity.project != null) {
    const query: any = {}
    if (cardId != null) query.card = cardId
    if (questionId != null) query.question = questionId
    if (commentId != null) query.comment = commentId
    const linkProps = {
      pathname: `/projects/${activity.projectId}`,
      query
    }
    return (
      <Link href={linkProps} shallow legacyBehavior>
        <a>{commonContent}</a>
      </Link>
    )
  }
  return (<>{commonContent}</>)
}

function formatDueDate (dueDateInput: any): Date | any {
  let dueDate = dueDateInput
  if (dueDate != null && (typeof dueDate === 'string' || typeof dueDate === 'number')) dueDate = new Date(dueDate)
  return dueDate
}

function ActivityRenderer (props: { displayActivity: DisplayActivity, currentUser?: User }): JSX.Element {
  const {
    displayActivity
  } = props
  const { question } = displayActivity
  let text: string | JSX.Element = ''
  const propsOfChild: any = {
    activity: displayActivity,
    cardId: null,
    commentId: null,
    questionId: null
  }
  switch (displayActivity.type) {
    case ActivityType.PROJECT_CREATE: {
      text = `created project ${displayActivity.data?.name ?? ''}`
      break
    }
    case ActivityType.PROJECT_UPDATE: {
      const isIndustryUpdate = displayActivity.data?.industry !== undefined
      const isNameUpdate = displayActivity.data?.name !== undefined
      const isDescriptionUpdate = displayActivity.data?.description !== undefined
      if (isNameUpdate) text += `updated project name to ${displayActivity.data?.name ?? ''}`
      if (isIndustryUpdate) text += ` updated project industry to ${displayActivity.data?.name ?? ''}`
      if (isDescriptionUpdate) text += ' updated project description'
      text = text.trim()
      break
    }
    case ActivityType.PROJECT_DELETE: {
      text = `deleted project ${displayActivity.data?.name ?? ''}`
      break
    }
    case ActivityType.PROJECT_USER_ADD: {
      text = `added user to project ${displayActivity.data?.name ?? ''}`.trim()
      break
    }
    case ActivityType.PROJECT_USER_REMOVE: {
      text = `removed user of project ${displayActivity.data?.name ?? ''}`.trim()
      break
    }
    case ActivityType.PROJECT_UPDATE_DESCRIPTION: {
      text = 'updated project description'
      break
    }
    case ActivityType.PROJECT_UPDATE_INDUSTRY: {
      text = `updated project industry to ${displayActivity.data?.industry ?? ''}`
      break
    }
    case ActivityType.PROJECT_UPDATE_NAME: {
      text = `updated project name to ${displayActivity.data?.name ?? ''}`
      break
    }
    case ActivityType.CARD_COLUMN_UPDATE: {
      text = `moved card to column "${displayActivity.data?.columnName ?? ''}"`
      propsOfChild.cardId = displayActivity.cardId
      break
    }
    case ActivityType.CARD_DUE_DATE_ADD: {
      const dueDate = formatDueDate(displayActivity.data?.dueDate)
      text = `added due date to card: "${dueDate instanceof Date ? format(dueDate, 'd MMM yyyy') : String(dueDate ?? '')}"`
      propsOfChild.cardId = displayActivity.cardId
      break
    }
    case ActivityType.CARD_DUE_DATE_UPDATE: {
      const dueDate = formatDueDate(displayActivity.data?.dueDate)
      text = `updated due date of card: "${dueDate instanceof Date ? format(dueDate, 'd MMM yyyy') : String(dueDate ?? '')}"`
      propsOfChild.cardId = displayActivity.cardId
      break
    }
    case ActivityType.CARD_DUE_DATE_DELETE: {
      text = 'deleted due date of card'
      propsOfChild.cardId = displayActivity.cardId
      break
    }
    case ActivityType.CARD_USER_ADD: {
      const [user] = displayActivity.users ?? []
      text = `assigned card to "${displayActivity.data?.name ?? ''}"`
      if (user != null) text = (<>assigned card of {getUserDisplayName(user)}</>)
      propsOfChild.cardId = displayActivity.cardId
      break
    }
    case ActivityType.CARD_USER_REMOVE: {
      const [user] = displayActivity.users ?? []
      text = `unassigned card of "${displayActivity.data?.name ?? ''}"`
      if (user != null) text = (<>unassigned card of {getUserDisplayName(user)}</>)
      propsOfChild.cardId = displayActivity.cardId
      break
    }
    case ActivityType.CARD_STAGE_UPDATE: {
      text = (
        <>
          <Text display='inline'>change card stage to </Text>
          <Text display='inline' textTransform='capitalize'>"{displayActivity.data?.stage?.toLowerCase()}"</Text>
        </>
      )
      propsOfChild.cardId = displayActivity.cardId
      break
    }
    case ActivityType.COMMENT_CREATE: {
      const { comment } = displayActivity
      text = (<Text display='inline'>commented on card</Text>)
      propsOfChild.cardId = displayActivity.cardId
      if (question != null) { // means the project is deleted
        text = <Text noOfLines={1} display='inline'>commented on question "{question.TOCnumber}"`</Text>
        propsOfChild.commentId = comment != null ? displayActivity.commentId : undefined
      }
      break
    }
    case ActivityType.COMMENT_CREATE_AND_MENTION: {
      const { comment, users = [] } = displayActivity
      text = 'commented and mentioned'
      if (!isEmpty(users)) {
        for (const user of users) {
          text += ` ${getUserDisplayName(user)}`
        }
      }
      text += ' on question'
      if (question != null) {
        text += ` "${question.TOCnumber ?? ''}"`
      }
      propsOfChild.cardId = displayActivity.cardId
      propsOfChild.commentId = comment != null ? displayActivity.commentId : undefined
      break
    }
    case ActivityType.COMMENT_UPDATE:
    case ActivityType.COMMENT_UPDATE_AND_MENTION: {
      const { comment, users = [] } = displayActivity
      text = 'updated comment with mentions'
      if (!isEmpty(users)) {
        text = `${text} of`
        for (const user of users) {
          text = `${text} ${getUserDisplayName(user)}`
        }
      }
      text = `${text} on question`
      if (question != null) {
        text = (<Text display='inline'>{text} {question.TOCnumber} </Text>)
      }
      propsOfChild.cardId = displayActivity.cardId
      propsOfChild.commentId = comment != null ? displayActivity.commentId : undefined
      break
    }
    case ActivityType.COMMENT_DELETE: {
      text = 'deleted comment on question'
      if (question != null) {
        text = (<Text display='inline'>{text} {question.TOCnumber}</Text>)
      }
      propsOfChild.cardId = displayActivity.cardId
      propsOfChild.questionId = displayActivity.questionId
      break
    }
    case ActivityType.QUESTION_CONCLUSION_UPDATE: {
      const { data } = displayActivity
      text = 'updated conclusion of question'
      if (question != null) {
        text = (<Text display='inline'>{text} {question.TOCnumber}</Text>)
      }
      if (data?.conclusion != null) {
        text = (<>{text}: "<Text display='inline' noOfLines={1} fontSize='xs' style={{ display: 'inline' }}>{data.conclusion}</Text>"</>)
      }
      propsOfChild.cardId = displayActivity.cardId
      propsOfChild.questionId = displayActivity.questionId
      break
    }
    case ActivityType.QUESTION_RESPONSE_UPDATE: {
      const { question, data } = displayActivity
      text = 'updated response of question'
      if (question != null) {
        text = (<Text display='inline'>{text} {question.TOCnumber}</Text>)
      }
      if (data?.responses != null && question?.answers != null) {
        if (question.type === QuestionType.CHECKBOX || question.type === QuestionType.RADIO) {
          const values = data?.responses.map((r: number) => question.answers[r].answer.replace(/=g(?:b|e)=/gi, ''))
          text = <>{text}: "<Text display='inline' fontSize='xs'>{values.join(',')}</Text>"</>
        } else {
          text = <>{text}: "<Text display='inline' fontSize='xs'>{data?.responses}</Text>"</>
        }
      }
      propsOfChild.cardId = displayActivity.cardId
      propsOfChild.questionId = displayActivity.questionId
      break
    }
    case ActivityType.ROLE_CREATE: {
      const { data } = displayActivity
      text = 'created role'
      if (data?.title != null || data?.name != null) {
        text = <Text display='inline'>{text}: "{data.title ?? data.name}"</Text>
      }
      break
    }
    case ActivityType.ROLE_DELETE: {
      const { data } = displayActivity
      text = 'deleted role'
      if (data?.name != null) {
        text = <Text display='inline'>{text}: "{data.name}"</Text>
      }
      break
    }
    case ActivityType.ROLE_UPDATE: {
      const { data } = displayActivity
      text = 'updated role'
      if (data?.name != null) {
        text = <Text display='inline'>{text}: "{data.name}"</Text>
      }
      break
    }
    case ActivityType.ROLE_USER_ADD: {
      const { users, role } = displayActivity
      const [user] = users ?? []
      text = 'added user to role'
      if (role?.name != null) {
        text = `${text} "${role.name}":`
      }
      if (user != null) {
        text = `${text} "${getUserDisplayName(user)}"`
      }
      break
    }
    case ActivityType.ROLE_USER_REMOVE: {
      const { users, role } = displayActivity
      const [user] = users ?? []
      text = 'removed user of role'
      if (role?.name != null) {
        text = `${text} "${role.name}":`
      }
      if (user != null) {
        text = `${text} "${getUserDisplayName(user)}"`
      }
      break
    }
  }

  return text !== '' ? <ProjectLinkComp {...propsOfChild}>{text}</ProjectLinkComp> : <></>
}

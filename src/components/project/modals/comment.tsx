import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  MouseEvent
} from 'react'
import {
  Box,
  Flex,
  Button,
  Avatar,
  Text,
  Grid,
  GridItem,
  useDisclosure,
  GridProps,
  Tooltip
} from '@chakra-ui/react'
import isEmpty from 'lodash.isempty'
import { useRouter } from 'next/router'
import { format } from 'date-fns'
import { RiDeleteBin6Line } from 'react-icons/ri'
import { GiCancel } from 'react-icons/gi'
import { Mention, MentionsInput } from 'react-mentions'
import { BsReply } from 'react-icons/bs'
import { timeAgo } from '@/util/index'
import { getUserDisplayName } from '@/util/users'
import UserContext from '@/src/store/user-context'
import ProjectContext from '@/src/store/project-context'
import ConfirmDialog from '@/src/components/confirm-dialog'
import { User } from '@/src/types/user'
import { Comment } from '@/src/types/comment'
import { useTranslation } from 'next-i18next'

const style = {
  control: {
    fontSize: 'var(--chakra-fontSizes-xs)'
  },
  input: {
    fontSize: 'var(--chakra-fontSizes-xs)'
  }
}

type CommentProps = {
  comment: Partial<Comment>
  setNewCommentParent?: (comment: Comment | undefined) => void
  onSave?: Function
  onCancel?: Function
  onDelete?: Function
} & GridProps

const maxLength = 1000

const CommentComponent = ({ comment, onSave, onCancel, onDelete, setNewCommentParent, ...rest }: CommentProps): JSX.Element => {
  const { t } = useTranslation()
  const router = useRouter()
  const { comment: commentId } = router.query
  const commentElement = useRef<HTMLDivElement>(null) // to be able to access the current one
  const { users, nonDeletedUsers, inactiveUsers } = useContext(ProjectContext)
  const { user } = useContext(UserContext)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [value, setValue] = useState(comment?.text ?? '')
  const [showEditOptions, setShowEditOptions] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [usersComment, setUsersComment] = useState<null | User>(null)
  const [parent, setParent] = useState<Comment | undefined>(comment?.parent)

  const mentionsUsers = useMemo(
    () => nonDeletedUsers?.map(u => ({ id: String(u._id), display: getUserDisplayName(u) }))
      .filter(u => u.id !== user?._id) ?? []
    , [nonDeletedUsers])

  useEffect(() => {
    if (commentElement?.current != null && commentId != null && commentId === comment._id) {
      setTimeout(() => commentElement.current?.scrollIntoView({ behavior: 'smooth' }), 400)
    }
  }, [commentId])

  useEffect(() => {
    if (comment?._id == null) setDisabled(false)
    else setDisabled(comment.userId !== user?._id)
  }, [comment?.userId, user?._id])

  useEffect(() => {
    setParent(comment.parent)
  }, [comment.parent])

  useEffect(() => {
    const activeAndInactiveUsers = users?.concat(inactiveUsers)
    if (comment?._id == null) setUsersComment(user)
    else {
      const userComment = activeAndInactiveUsers?.find(u => u._id === comment.userId)
      setUsersComment(userComment)
    }
  }, [comment?.userId, user, users])

  useEffect(() => {
    if (comment.parent != null && comment.parent.user == null) {
      const parentUser = nonDeletedUsers?.find(u => u._id === comment.parent?.userId)
      comment.parent.user = parentUser
    }
  }, [comment?.parent?.user, nonDeletedUsers])

  const saveHandler = (e: any): void => {
    e.preventDefault()
    e.stopPropagation()
    const val = value.trim().replace(/\n+$/, '')
    const parentId = parent?._id
    const payload = { text: val, parentId: parentId ?? null }
    if (onSave != null) onSave(payload)
    if (comment._id == null) {
      setValue('')
      setParent(undefined)
    } else {
      setValue(val)
    }
    setShowEditOptions(false)
  }

  const cancelHandler = (): void => {
    setValue(comment?.text ?? '')
    setParent(comment?.parent)
    onCancel != null && onCancel({ text: value }) // eslint-disable-line @typescript-eslint/prefer-optional-chain
    setShowEditOptions(false)
  }

  const replyToHandler = (): void => {
    if (setNewCommentParent != null) setNewCommentParent(comment as Comment)
  }

  return (
    <Grid templateColumns='min-content auto min-content' rowGap='0' _notFirst={{ marginTop: 2 }} ref={commentElement} {...rest}>
      <GridItem colSpan={1} />
      <GridItem colSpan={2} display='flex'>
        {comment.createdAt != null && <Text fontSize='x-small' color='var(--text-grey)'>{timeAgo(comment.createdAt)}</Text>}
        {comment.updatedAt != null && <Text fontSize='x-small' ml='1' textDecoration='underline' color='var(--text-grey)'>(Edited)</Text>}
      </GridItem>
      <GridItem colSpan={1}>
        {usersComment != null && <Avatar size='xs' name={getUserDisplayName(usersComment)} src={usersComment?.xsAvatar} mr='1' mt='1' />}
      </GridItem>
      <GridItem colSpan={1}>
        <Box width='100%' boxShadow='rgb(0 0 0 / 10%) 0 0 10px' borderRadius='0.5rem' padding='2'>
          {comment.deletedAt == null &&
            <>
              {parent != null && <ParentComment comment={parent} />}
              <MentionsInput
                style={style}
                disabled={disabled}
                value={value}
                maxLength={maxLength}
                onFocus={() => setShowEditOptions(true)}
                onKeyDown={(e) => {
                  const target = e.target as HTMLInputElement
                  if (e.key === 'Backspace' && target.selectionStart === 0 && parent != null) {
                    setParent(undefined)
                  }
                }}
                onPaste={(e) => {
                  const pastedData = e.clipboardData.getData('Text')
                  const isAdditionToLong = value.length + pastedData.length > maxLength
                  if (value.length >= maxLength || isAdditionToLong) {
                    // prevent default paste
                    e.preventDefault()
                    e.stopPropagation()
                    if (isAdditionToLong) setValue(value + pastedData.substring(0, maxLength - value.length))
                  }
                }}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`${t('placeholders:write-comment')}`}
                className='mentions'
                a11ySuggestionsListLabel='Suggested mentions'
              >
                <Mention trigger='@' data={mentionsUsers} className='mentions__mention' appendSpaceOnAdd displayTransform={(id, display) => `@${display}`} />
              </MentionsInput>
              {showEditOptions && <EditOptions comment={comment} parent={parent} value={value} saveHandler={saveHandler} cancelHandler={cancelHandler} onOpen={onOpen} />}
            </>}
          {comment.deletedAt != null && <Text fontSize='xs' color='var(--text-grey)'>Comment deleted on {format(new Date(comment.deletedAt), 'dd MMM yyyy')}</Text>}
        </Box>
      </GridItem>
      <GridItem colSpan={1} display='flex' flexDirection='column' justifyContent='flex-end'>
        {comment._id != null && comment.deletedAt == null &&
          <Tooltip label='Reply' fontSize='sm' aria-label='Reply'>
            <BsReply size='20px' className='ml-1 cursor-pointer -scale-x-100 mb-0.5' color='var(--main-blue)' onClick={replyToHandler} />
          </Tooltip>}
      </GridItem>
      <ConfirmDialog isOpen={isOpen} onClose={onClose} confirmHandler={(e: MouseEvent) => onDelete != null ? onDelete(comment) : null} />
    </Grid>
  )
}

export default CommentComponent

const ParentComment = ({ comment, ...rest }: CommentProps): JSX.Element => {
  const router = useRouter()
  const userName = comment.user != null ? getUserDisplayName(comment.user) : ''
  const nbOflines = (comment.text ?? '').split(/\n/).length
  const values = (comment.text ?? '').split(/\n/, 2)
  if (values[0].length > 100) {
    values[0] = values[0].substring(0, 100) + '...'
    values[1] = ''
  }
  if (values[1] != null && values[1].length > 100) {
    values[1] = values[1].substring(0, 100) + '...'
  }
  let value = values.join('\n').trim()
  if (nbOflines > 2 && !value.endsWith('...')) value += '...'

  const clikHandler = (): void => {
    const query = router.query
    query.comment = ''
    void router
      .push({ query }, undefined, { shallow: true })
      .then(async () => await router.push({ query: { ...query, comment: comment._id } }, undefined, { shallow: true }))
  }

  return (
    <Box backgroundColor='lightcyan' borderLeftColor='var(--main-blue)' borderLeftWidth='2px' borderRadius='0.5rem' {...rest} p='1' cursor='pointer'>
      <Box display='flex'>
        <Avatar size='2xs' name={userName} src={comment.user?.xsAvatar} mr='1' display='block' />
        <Text fontSize='x-small' fontWeight='600' ml='1' mr='1'>{userName}</Text>
      </Box>
      <Box position='relative'>
        <MentionsInput
          style={style}
          disabled
          value={value}
          className='mentions'
          maxLength={20}
        >
          <Mention trigger='@' data={[]} className='mentions__mention' appendSpaceOnAdd displayTransform={(id, display) => `@${display}`} />
        </MentionsInput>
        <Box position='absolute' top='0' right='0' bottom='0' left='0' cursor='pointer' onClick={clikHandler} />
      </Box>
    </Box>
  )
}

interface EditOptionsProps {
  comment: Partial<Comment>
  parent: Comment | undefined
  value: string
  saveHandler: (e: any) => void
  cancelHandler: (e: any) => void
  onOpen: () => void
}

const EditOptions = ({ comment, value, parent, saveHandler, cancelHandler, onOpen }: EditOptionsProps): JSX.Element => {
  const { t } = useTranslation()
  const [disabled, setDisabled] = useState(false)
  useEffect(() => {
    if (isEmpty(value)) setDisabled(true)
    else if (comment.text === value && comment.parentId === parent?._id) setDisabled(true)
    else setDisabled(false)
  }, [value, comment.text, parent, comment.parentId])

  return (
    <Flex alignItems='center' justifyContent='space-between' mt='1'>
      <Flex alignItems='center'>
        <Button size='sm' colorScheme='blue' disabled={disabled} onClick={saveHandler}>{t('buttons:save')}</Button>
        <GiCancel size='20px' color='#286cc3' cursor='pointer' className='ml-1' onClick={cancelHandler} />
      </Flex>
      {comment._id != null && <RiDeleteBin6Line cursor='pointer' color='#286cc3' onClick={onOpen} />}
    </Flex>
  )
}

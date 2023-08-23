import React, { FC, useContext, useState } from 'react'
import {
  Box,
  BoxProps
} from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { isEmpty, isEqual } from '@/util/index'
import { defaultFetchOptions, HTTP_METHODS, getResponseHandler } from '@/util/api'
import CommentComponent from './comment'
import { Question, DisplayQuestion } from '@/src/types/card'
import { Comment } from '@/src/types/comment'
import { QuestionComp } from '@/src/components/project/modals/question'
import ToastContext from '@/src/store/toast-context'

type Props = {
  projectId: string
  cardId: string
  question: DisplayQuestion
  questionSaveCallback?: Function
} & BoxProps

const QuestionAndComments: FC<Props> = ({ cardId, projectId, question, questionSaveCallback, ...rest }): JSX.Element => {
  const router = useRouter()
  const [, setIsLoading] = useState(false)
  const { showToast } = useContext(ToastContext)
  const [renderTrigger, setRenderTrigger] = useState(0)
  const [newComment, setNewComment] = useState<Partial<Comment>>({})

  const responseHandler = getResponseHandler(showToast)

  const saveQuestion = async (question: Question, responses?: any[], conclusion?: string): Promise<void> => {
    setIsLoading(true)
    try {
      const url = `/api/projects/${projectId}/cards/${cardId}/questions/${question.id}`
      const data: any = {}
      if (Array.isArray(responses)) {
        // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
        if (!Array.isArray(question?.responses) || (Array.isArray(question?.responses) && !isEqual(question.responses?.sort(), responses.sort()))) {
          data.responses = responses
        }
      }
      if (conclusion != null && question.conclusion !== conclusion) data.conclusion = conclusion

      if (isEmpty(data)) return

      const response = await fetch(url, {
        ...defaultFetchOptions,
        method: HTTP_METHODS.PATCH,
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        await responseHandler(response)
      } else {
        if (conclusion != null) question.conclusion = conclusion
        if (responses != null) question.responses = responses
      }
      if (questionSaveCallback != null) questionSaveCallback()
    } finally {
      setIsLoading(false)
    }
  }

  const saveComment = async (comment: Partial<Comment>, data: Partial<Comment>, question: DisplayQuestion): Promise<void> => {
    setIsLoading(true)
    let method = HTTP_METHODS.PATCH
    let url = `/api/projects/${projectId}/cards/${cardId}/questions/${question.id}/comments/${String(comment._id)}`
    if (isEmpty(comment._id)) {
      method = HTTP_METHODS.POST
      url = `/api/projects/${projectId}/cards/${cardId}/questions/${question.id}/comments`
    }

    const response = await fetch(url, {
      ...defaultFetchOptions,
      method,
      body: JSON.stringify(data)
    })
    if (response.ok) {
      const newComment = await response.json()
      if (newComment.parentId != null && newComment.parent == null && comment.parent?._id === newComment.parentId) {
        newComment.parent = comment.parent
      }
      question.comments = question.comments ?? []
      const commentIdx = question.comments.findIndex(c => c._id === comment._id)
      if (commentIdx >= 0) question.comments.splice(commentIdx, 1, newComment)
      else question.comments = [newComment, ...question.comments]
      setRenderTrigger(renderTrigger + 1)
    } else {
      await responseHandler(response)
    }
    setIsLoading(false)
  }

  const deleteComment = async (comment: Comment, question: DisplayQuestion): Promise<void> => {
    setIsLoading(true)
    const url = `/api/projects/${projectId}/cards/${cardId}/questions/${question.id}/comments/${comment._id}`
    const response = await fetch(url, {
      ...defaultFetchOptions,
      method: HTTP_METHODS.DELETE,
      body: '{}'
    })
    if (response.ok) {
      const deletedComment = await response.json()
      question.comments = question.comments ?? []
      question.comments = question.comments.map(c => c._id === comment._id ? deletedComment : c)
      setRenderTrigger(renderTrigger + 1)
    } else {
      await responseHandler(response)
    }
    setIsLoading(false)
  }

  const setNewCommentParent = (comment: Comment | undefined): void => {
    newComment.parent = comment
    newComment.parentId = comment?._id
    setNewComment({ ...newComment })
    const query: any = { ...router.query }
    delete query.comment
    delete query.question
    void router.push({ query }, undefined, { shallow: true })
      .then(async () => await router.push({ query: { ...query, question: question.id } }, undefined, { shallow: true }))
  }

  return (
    <Box {...rest}>
      <QuestionComp question={question} onChange={saveQuestion} />
      <CommentComponent comment={newComment} onSave={async (data: Partial<Comment>) => await saveComment(newComment, data, question)} ml='3' />
      {question.comments?.map(c => (
        <CommentComponent key={c._id} comment={c} setNewCommentParent={setNewCommentParent} onSave={async (data: Partial<Comment>) => await saveComment(c, data, question)} onDelete={async () => await deleteComment(c, question)} ml='3' />
      ))}
    </Box>
  )
}

export default QuestionAndComments

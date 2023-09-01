import { ObjectId } from 'mongodb'
import { connectToDatabase, toObjectId, sanitize } from '@/src/models/mongodb'
import { getColumnsByProjectId } from '@/src/models/column'
import { Card, STAGE_VALUES, Question, Answer } from '@/src/types/card'
import { isEqual } from '@/util/index'
import isEmpty from 'lodash.isempty'
import Activity from '@/src/models/activity'

export const TABLE_NAME = 'cards'

const UPDATABLE_FIELDS = ['title', 'desc', 'sequence', 'columnId', 'label', 'dueDate', 'stage']

const ISODATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const UNIX_TIMESTAMP_REGEX = /^\d{10}$/
const UNIX_TIMESTAMP_MS_REGEX = /^\d{13}$/

export const getCard = async (_id: string | ObjectId): Promise<Card> => {
  const { db } = await connectToDatabase()
  const where: any = {
    _id: toObjectId(_id)
  }
  const card = await db
    .collection(TABLE_NAME)
    .findOne(where)
  return card
}

export const deleteCards = async (where: any): Promise<boolean> => {
  const { db } = await connectToDatabase()
  where = sanitize(where)
  if (where._id != null) where._id = toObjectId(where._id)
  if (where.projectId != null) where.projectId = toObjectId(where.projectId)
  const res = await db
    .collection(TABLE_NAME)
    .deleteMany(where)
  return res.result.ok === 1
}

export const getCards = async (
  { projectId, columnId, category }: { projectId: string | ObjectId, columnId?: string, category?: string }
): Promise<Card[]> => {
  const { db } = await connectToDatabase()
  const where: any = {
    projectId: toObjectId(projectId)
  }
  if (columnId != null) where.columnId = toObjectId(columnId)
  if (category != null) where.category = sanitize(category)
  const cards = await db
    .collection(TABLE_NAME)
    .find(where).toArray()
  return cards
}

export const createCards = async (cards: Card[]): Promise<boolean> => {
  const { db } = await connectToDatabase()
  cards = sanitize(cards)
  cards.map(c => ({
    ...c,
    ...(c._id != null ? { _id: toObjectId(c._id) } : {}),
    ...(c.projectId != null ? { projectId: toObjectId(c.projectId) } : {}),
    ...(c?.userIds != null && c?.userIds?.length > 0 ? { userIds: c?.userIds?.map(toObjectId) } : {}),
    ...(c?.roleIds != null && c?.roleIds?.length > 0 ? { roleIds: c?.roleIds?.map(toObjectId) } : {})
  }))
  const res = await db
    .collection(TABLE_NAME)
    .insertMany(cards)
  return res.result.ok === 1
}

export const updateCardAndCreateActivities = async (cardId: string | ObjectId, userId: string, data: any): Promise<boolean> => {
  const sanitizedData = await cardDataSanitizer(cardId, data)
  // console.log(data, sanitizedData)
  if (isEmpty(sanitizedData)) return false
  const res = await updateCard(cardId, sanitizedData)
  if (res) {
    if (sanitizedData.stage != null) void Activity.createCardStageUpdateActivity(cardId, userId, sanitizedData.stage)
    if (sanitizedData.columnId != null) void Activity.createCardColumnUpdateActivity(cardId, userId, sanitizedData.columnId)
    if (Object.keys(sanitizedData).includes('dueDate')) void Activity.createCardDueDateUpdateActivity(cardId, userId, sanitizedData.dueDate)
  }
  return res
}

export const cardDataSanitizer = async (cardId: string, data: any): Promise<any> => {
  const updatableFields: any = {}
  UPDATABLE_FIELDS.forEach(field => {
    if (Object.keys(data).includes(field)) updatableFields[field] = sanitize(data[field])
  })
  const card = await getCard(cardId)
  const columns = await getColumnsByProjectId(card.projectId)
  if (updatableFields.columnId != null && columns.find(c => String(c._id) === String(updatableFields.columnId)) == null) throw new Error('Invalid columnId')
  if (updatableFields.columnId != null) updatableFields.columnId = toObjectId(updatableFields.columnId)
  if (typeof updatableFields.stage === 'string' && !STAGE_VALUES.includes(updatableFields.stage.toLowerCase())) throw new Error('Invalid stage')
  if (updatableFields.stage != null) updatableFields.stage = updatableFields.stage.toUpperCase()
  if (updatableFields.dueDate != null && !(updatableFields.dueDate instanceof Date)) {
    if (typeof updatableFields.dueDate === 'string' && ISODATETIME_REGEX.test(updatableFields.dueDate)) updatableFields.dueDate = new Date(updatableFields.dueDate)
    else if ((typeof updatableFields.dueDate === 'string' || typeof updatableFields.dueDate === 'number') && UNIX_TIMESTAMP_REGEX.test(`${String(updatableFields.dueDate)}`)) updatableFields.dueDate = new Date(+`${updatableFields.dueDate as string}000`)
    else if ((typeof updatableFields.dueDate === 'string' || typeof updatableFields.dueDate === 'number') && UNIX_TIMESTAMP_MS_REGEX.test(`${String(updatableFields.dueDate)}`)) updatableFields.dueDate = new Date(+updatableFields.dueDate)
    else throw new Error('Invalid dueDate')
  }
  console.log('updatableFields', updatableFields)
  return updatableFields
}

export const updateCard = async (_id: string | ObjectId, data: any): Promise<boolean> => {
  const { db } = await connectToDatabase()
  _id = toObjectId(_id)
  const updatableFields: any = await cardDataSanitizer(_id, data)
  if (isEmpty(updatableFields)) return false
  const res = await db
    .collection(TABLE_NAME)
    .updateOne({ _id }, { $set: { ...updatableFields } })
  return res.result.ok === 1
}

export const addUserToCard = async (cardId: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  const res = await db.collection(TABLE_NAME).updateOne(
    { _id: toObjectId(cardId) },
    {
      $addToSet: {
        userIds: toObjectId(userId)
      }
    }
  )
  return res.result.ok === 1
}

export const removeUserFromCard = async (cardId: ObjectId | string, userId: ObjectId | string): Promise<boolean> => {
  const { db } = await connectToDatabase()
  const res = await db.collection(TABLE_NAME).updateOne(
    { _id: toObjectId(cardId) },
    {
      $pull: {
        userIds: toObjectId(userId)
      }
    }
  )
  return res.result.ok === 1
}

export const addUserToCardAndCreateActivity = async (cardId: string | ObjectId, userId: string, userIdToAdd: string): Promise<boolean> => {
  const res = await addUserToCard(cardId, userIdToAdd)
  if (res) void Activity.createCardUserAddActivity(cardId, userId, userIdToAdd)
  return res
}

export const removeUserFromCardAndCreateActivity = async (cardId: string | ObjectId, userId: string, userIdToAdd: string): Promise<boolean> => {
  const res = await addUserToCard(cardId, userIdToAdd)
  if (res) void Activity.createCardUserRemoveActivity(cardId, userId, userIdToAdd)
  return res
}

export const deleteProjectCards = async (projectId: string | ObjectId): Promise<boolean> => {
  if (isEmpty(projectId)) return false
  return await deleteCards({ projectId })
}

export const updateQuestionAndCreateActivity = async (cardId: string | ObjectId, userId: string, questionId: string, data: any): Promise<boolean> => {
  const sanitizedData = await sanitizeQuestionData(data, cardId, questionId)
  const res = await updateQuestion(cardId, questionId, sanitizedData)
  if (res) void Activity.createCardQuestionUpdateActivity(cardId, questionId, userId, sanitizedData)
  return res
}

export const sanitizeQuestionData = async (data: any, cardId: string, questionId: string, card?: Card): Promise<{ responses?: string[], conculusion?: string }> => {
  if (card == null) {
    card = await getCard(cardId)
  }
  const question = card.questions.find(q => q.id === questionId)
  if (question == null) throw new Error('Invalid questionId')
  const sanitizedData: any = {}
  if (data.responses != null && !isEqual(question?.responses?.sort(), data.responses.sort())) {
    sanitizedData.responses = sanitize(data.responses)
  }
  if (data.conclusion != null && question.conclusion !== data.conclusion) {
    sanitizedData.conclusion = sanitize(data.conclusion)
  }
  return sanitizedData
}

export const updateQuestion = async (cardId: ObjectId | string, questionId: string, data: any): Promise<boolean> => {
  const { db } = await connectToDatabase()
  const { responses, conclusion } = data
  const set: any = {}
  if (responses != null) set['questions.$.responses'] = sanitize(responses)
  if (conclusion != null) set['questions.$.conclusion'] = sanitize(conclusion)
  const res = await db.collection(TABLE_NAME).updateOne(
    { _id: toObjectId(cardId), 'questions.id': questionId },
    {
      $set: set
    }
  )
  return res.result.ok === 1
}

export const dataToCards = async (data: any[], projectId?: string | ObjectId, columnId?: string | ObjectId): Promise<Card[]> => {
  const cards: Card[] = []
  let catIdx = 1
  for (const cat of data) {
    let idx = 0
    for (const card of cat.cards) {
      const returnCard: Card = {
        ...card,
        category: cat.id,
        originalId: card.id,
        _id: ObjectId(),
        ...(projectId != null ? { projectId: toObjectId(projectId) } : {}),
        ...(columnId != null ? { columnId: toObjectId(columnId) } : {}),
        sequence: idx,
        TOCnumber: `${catIdx}.${idx + 1}`,
        title: card.title
      }
      returnCard.questions = card.questions.map((q: any, i: number): Question => ({
        ...q,
        TOCnumber: `${returnCard.TOCnumber}.${i + 1}`,
        title: q.title,
        ...(q.answers != null ? { answers: q.answers.map((a: Answer) => { a.answer = a.answer.trim(); return a }) } : {})
      }))
      cards.push(returnCard)
      idx++
    }
    catIdx++
  }
  return cards
}

import { ObjectId } from 'mongodb'
import { toObjectId, connectToDatabase } from '@/src/models/mongodb'
import { Activity as ActivityTypeDef, ActivityData, ActivityType, ActivityVisibility } from '@/src/types/activity'
import { isEmpty } from '@/util/index'
import { CardStage } from '@/src/types/card'
import { Comment as CommentType } from '@/src/types/comment'
import { Project, Role } from '@/src/types/project'
import Model, { generatePaginationQuery } from '@/src/models/model'
import { Comment } from '@/src/models/comment'
import { getCard } from '@/src/models/card'
import { getColumn } from '@/src/models/column'
import { getUser } from '@/src/models/user'
import { getUserDisplayName } from '@/util/users'
import industries from '@/src/data/industries.json'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class Activity extends Model {
  static TABLE_NAME = 'activities'

  static async createProjectCreateActivity (projectId: string, createdBy: string, project: Partial<Project>): Promise<string | null> {
    const industry = industries.find(i => i._id === String(project.industryId))
    const data = {
      name: project.name,
      industry: industry?.name
    }
    return await this.createActivity(projectId, createdBy, ActivityType.PROJECT_CREATE, data)
  }

  static async createProjectUpdateActivities (projectId: string, createdBy: string, newData: Partial<Project>): Promise<string[]> {
    const newActivityIds: Array<string | null> = []
    if (newData.name != null) newActivityIds.push(await this.createActivity(projectId, createdBy, ActivityType.PROJECT_UPDATE_NAME, { name: newData.name }))
    if (newData.description != null) newActivityIds.push(await this.createActivity(projectId, createdBy, ActivityType.PROJECT_UPDATE_DESCRIPTION))
    if (newData.industryId != null) {
      const industry = industries.find(i => i._id === String(newData.industryId))
      newActivityIds.push(await this.createActivity(projectId, createdBy, ActivityType.PROJECT_UPDATE_INDUSTRY, { industry: industry?.name }))
    }
    return newActivityIds.filter(id => id != null) as string[]
  }

  static async createRoleActivity (projectId: string, createdBy: string, roleId: string, newData: Partial<Role>, activityType: ActivityType = ActivityType.ROLE_UPDATE): Promise<string | null> {
    const data: ActivityData = {}
    if (newData.name != null) data.name = newData.name
    if (newData.desc != null) data.description = true
    if (isEmpty(data)) return null
    return await this.createActivity(projectId, createdBy, activityType, data, { roleId })
  }

  static async createCardUserChangeActivity (cardId: string, createdBy: string, userId: string, type: ActivityType): Promise<string | null> {
    const card = await getCard(cardId)
    if (card == null) {
      // TODO: log error
      return null
    }
    const data = await Activity.getUserName(userId)
    return await this.createActivity(card.projectId, createdBy, type, data, { cardId, userIds: [userId] })
  }

  static async getUserName (userId: string): Promise<any> {
    const user = await getUser({ _id: toObjectId(userId) })
    let data: any = null
    if (user != null) {
      data = { name: getUserDisplayName(user) }
      return data
    }
  }

  static async createCardUserAddActivity (cardId: string, createdBy: string, userId: string): Promise<string | null> {
    return await this.createCardUserChangeActivity(cardId, createdBy, userId, ActivityType.CARD_USER_ADD)
  }

  static async createCardUserRemoveActivity (cardId: string, createdBy: string, userId: string): Promise<string | null> {
    return await this.createCardUserChangeActivity(cardId, createdBy, userId, ActivityType.CARD_USER_REMOVE)
  }

  static async removeUserProjectActivity (projectId: string, createdBy: string, userId: string): Promise<string | null> {
    const data = await Activity.getUserName(userId)
    return await this.createActivity(projectId, createdBy, ActivityType.PROJECT_USER_REMOVE, data, { userIds: [userId] })
  }

  static async createCardDueDateAddActivity (projectId: string, createdBy: string, cardId: string, dueDate: Date): Promise<string | null> {
    return await this.createActivity(projectId, createdBy, ActivityType.CARD_DUE_DATE_ADD, { dueDate }, { cardId })
  }

  static async createCardDueDateUpdateActivity (cardId: string, createdBy: string, dueDate: Date): Promise<string | null> {
    const card = await getCard(cardId)
    if (card == null) {
      // TODO: log error
      return null
    }
    if (isEmpty(dueDate)) {
      return await this.createCardDueDateDeleteActivity(card.projectId, createdBy, cardId)
    }
    return await this.createActivity(card.projectId, createdBy, ActivityType.CARD_DUE_DATE_UPDATE, { dueDate }, { cardId })
  }

  static async createCardDueDateDeleteActivity (projectId: string, createdBy: string, cardId: string): Promise<string | null> {
    return await this.createActivity(projectId, createdBy, ActivityType.CARD_DUE_DATE_DELETE, null, { cardId })
  }

  static async createActivity (projectId: string, createdBy: string, type: ActivityType, data?: any, subjectEntity?: { userIds?: string[], questionId?: string, commentId?: string, roleId?: string, cardId?: string }): Promise<string | null> {
    const activity: ActivityTypeDef = {
      _id: new ObjectId(),
      projectId: toObjectId(projectId),
      createdBy: toObjectId(createdBy),
      type,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
      visibility: ActivityVisibility.PUBLIC
    }
    if (subjectEntity?.userIds != null) activity.userIds = subjectEntity.userIds.map(toObjectId)
    if (subjectEntity?.commentId != null) activity.commentId = toObjectId(subjectEntity.commentId)
    if (subjectEntity?.roleId != null) activity.roleId = toObjectId(subjectEntity.roleId)
    if (subjectEntity?.cardId != null) activity.cardId = toObjectId(subjectEntity.cardId)
    if (subjectEntity?.questionId != null) activity.questionId = subjectEntity.questionId

    return await this.create(activity)
  }

  static async addUserToSeenBy (activityId: string, userId: string): Promise<boolean> {
    const { db } = await connectToDatabase()
    const res = await db.collection(this.TABLE_NAME).updateOne({ _id: toObjectId(activityId) }, { $addToSet: { seenBy: toObjectId(userId) } })
    return res.modifiedCount === 1
  }

  static async createCardStageUpdateActivity (cardId: string, userId: string, stage: CardStage): Promise<string | null> {
    const card = await getCard(cardId)
    if (card == null) {
      // TODO: log error
      return null
    }
    return await this.createActivity(card.projectId, userId, ActivityType.CARD_STAGE_UPDATE, { stage }, { cardId })
  }

  static async createCardColumnUpdateActivity (cardId: string, userId: string, columnId: string): Promise<string | null> {
    const card = await getCard(cardId)
    if (card == null) {
      // TODO: log error
      return null
    }
    const column = await getColumn(columnId)
    return await this.createActivity(card.projectId, userId, ActivityType.CARD_COLUMN_UPDATE, { columnName: column.name }, { cardId })
  }

  static async createCommentCreateActivity (comment: CommentType): Promise<string | null> {
    const { projectId, userId, _id: commentId, userIds, questionId, cardId } = comment
    if (userIds != null && userIds?.length > 0) {
      return await this.createActivity(projectId, userId, ActivityType.COMMENT_CREATE_AND_MENTION, null, { commentId, userIds, cardId, questionId })
    }
    return await this.createActivity(projectId, userId, ActivityType.COMMENT_CREATE, null, { commentId, cardId, questionId })
  }

  static async createCommentDeleteActivity (commentId: string, userId: string | ObjectId): Promise<string | null> {
    userId = toObjectId(userId)
    const result = await this.find({
      commentId: toObjectId(commentId),
      $or: [
        { type: ActivityType.COMMENT_CREATE_AND_MENTION },
        { type: ActivityType.COMMENT_CREATE }
      ]
    }, 1)
    const activity = result?.data[0]
    if (activity == null) {
      // TODO should be logged
      return null
    }
    const { projectId } = activity
    return await this.createActivity(projectId, userId, ActivityType.COMMENT_DELETE, null, { commentId })
  }

  static async createCommentUpdateActivity (commentId: string): Promise<string | null> {
    const comment = await Comment.get(commentId)
    if (comment == null) return null
    const { projectId, userId, userIds, questionId, cardId } = comment
    if (userIds != null && userIds?.length > 0) {
      return await this.createActivity(projectId, userId, ActivityType.COMMENT_UPDATE_AND_MENTION, null, { commentId, userIds, cardId, questionId })
    }
    return await this.createActivity(projectId, userId, ActivityType.COMMENT_UPDATE, null, { commentId, cardId, questionId })
  }

  static async createCardQuestionUpdateActivity (cardId: string, questionId: string, userId: string, data: { conclusion?: string, responses?: string[] }): Promise<Array<string | null>> {
    const card = await getCard(cardId)
    if (card == null) {
      // TODO: log error
      return []
    }
    const question = card.questions.find(q => q.id === questionId)
    if (question == null) {
      // TODO: log error
      return []
    }

    const activityIds: Array<string | null> = []
    if (data.conclusion != null) activityIds.push(await this.createActivity(card.projectId, userId, ActivityType.QUESTION_CONCLUSION_UPDATE, { conclusion: data.conclusion }, { cardId, questionId }))
    if (data.responses != null) activityIds.push(await this.createActivity(card.projectId, userId, ActivityType.QUESTION_RESPONSE_UPDATE, { responses: data.responses }, { cardId, questionId }))
    return activityIds
  }

  // WIP this function is not finished
  // static async getActivitiesForUser (userId: string, where: any, limit: number = 500, sort: [field: string, order: number], page?: string): Promise<{ count: number, limit: number, data: any[], page: string }> {
  //   const projects = await getUserProjects(userId)
  //   if (projects == null || projects.length === 0) return { count: 0, limit, data: [], page: '' }
  //   addToWhere(where, 'projectId', projects.map((p) => p._id), '$in')
  //   return await Activity.find(where, limit, Object.entries(sort)[0], page)
  // }

  static async find (where: any, limit: number = 500, sort: [field: string, order: number] = ['_id', 1], page?: string): Promise<{ count: number, limit: number, data: any[], page: string }> {
    const { db } = await connectToDatabase()
    if (where._id != null) where._id = toObjectId(where._id)
    const { wherePagined, nextKeyFn } = generatePaginationQuery(where, sort, page)
    const res = await db
      .collection(this.TABLE_NAME)
      .aggregate([
        { $match: wherePagined },
        { $sort: { [sort[0]]: sort[1] } },
        { $limit: limit },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        // {
        //   $lookup: {
        //     from: 'projects',
        //     localField: 'roleId',
        //     foreignField: 'roles._id',
        //     as: 'role'
        //   }
        // },
        {
          $lookup: {
            from: 'cards',
            localField: 'cardId',
            foreignField: '_id',
            as: 'card'
          }
        },
        {
          $lookup: {
            from: 'cards',
            // localField: 'questionId',
            // foreignField: 'questions.id', // doesn't work, we end up with the cards and not the questions
            let: { question_id: '$questionId' },
            pipeline: [
              { $unwind: '$questions' },
              { $match: { $expr: { $eq: ['$questions.id', '$$question_id'] } } },
              { $replaceRoot: { newRoot: '$questions' } }
            ],
            as: 'questions'
          }
        },
        {
          $lookup: {
            from: 'projects',
            // localField: 'questionId',
            // foreignField: 'questions.id', // doesn't work, we end up with the cards and not the questions
            let: { role_id: '$roleId' },
            pipeline: [
              { $unwind: '$roles' },
              { $match: { $expr: { $eq: ['$roles._id', '$$role_id'] } } },
              { $replaceRoot: { newRoot: '$roles' } }
            ],
            as: 'roles'
          }
        },
        {
          $lookup: {
            from: 'comments',
            localField: 'commentId',
            foreignField: '_id',
            as: 'comment'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'creator'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userIds',
            foreignField: '_id',
            as: 'users'
          }
        },
        { $addFields: { question: { $first: '$questions' } } },
        { $addFields: { role: { $first: '$roles' } } },
        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$card', preserveNullAndEmptyArrays: true } },
        // { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$comment', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            'project.roles': 0,
            'project.userIds': 0,
            'project._id': 0,
            'project.description': 0,
            'project.createdAt': 0,
            'project.createdBy': 0,
            'card.questions': 0,
            'card.id': 0,
            questions: 0,
            roles: 0,
            // 'card.questions.title': 0,
            // 'card.questions.type': 0,
            // 'card.questions.isVisibleIf': 0,
            // 'card.questions.isScored': 0,
            // 'card.questions.answers': 0,
            // 'card.questions.responses': 0,
            // 'card.questions.conclusion': 0,
            // 'card.questions.TOCnumber': 0,
            'card.originalId': 0,
            'card.projectId': 0,
            'card.createdAt': 0,
            'card.updatedAt': 0,
            'card.userIds': 0,
            'card.example': 0,
            'card.desc': 0,
            'card.section': 0,
            'card.category': 0,
            'card.columnId': 0,
            'card.sequence': 0,
            'creator.password': 0,
            'creator.avatar': 0,
            'creator.emailVerified': 0,
            'creator.email': 0,
            'creator.organization': 0,
            'creator.createdAt': 0,
            'creator.department': 0,
            'creator.xsAvatar': 0,
            'creator._id': 0,
            'users.password': 0,
            'users.avatar': 0,
            'role.createdAt': 0,
            'role.createdBy': 0,
            'question.title': 0,
            'question.isVisibleIf': 0,
            'question.isScored': 0,
            'question.answers.score': 0,
            'comment._id': 0,
            'comment.projectId': 0,
            'comment.cardId': 0,
            'comment.createdAt': 0,
            'comment.questionId': 0
          }
        }
      ])
    const count = await db
      .collection(this.TABLE_NAME)
      .find(where)
      .sort([sort])
      .count()

    const data = await res.toArray()
    return {
      count,
      limit,
      page: nextKeyFn(data),
      data: await res.toArray()
    }
  }
}

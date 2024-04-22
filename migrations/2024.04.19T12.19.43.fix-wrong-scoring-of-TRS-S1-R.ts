import { Db, MongoClient } from 'mongodb'
import type { MigrationFn } from 'umzug'
import data2 from '../src/data/altai2.json'

const QUESTION_ID = 'TRS-S1-R'

export const up: MigrationFn = async (params: any) => {
  const question = data2.cards.map(c => c.questions.find(q => q.id === QUESTION_ID)).filter(i => i != null).pop()
  const client: MongoClient = params.context.client
  const db: Db = params.context.db

  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      await db.collection('cards').update({
        'questions.id': QUESTION_ID
      },
      { $set: { 'questions.$.answers': question?.answers } }
      )
    })
  } finally {
    await session.endSession()
  }
}

export const down: MigrationFn = async params => {}

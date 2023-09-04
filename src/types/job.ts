import { ObjectId } from 'mongodb'

export enum JobType {
}

export interface ActivityData {
  name?: string
  industry?: string
  columnName?: string
  [key: string]: any
}

export enum JobStatus {
  FINISHED = 'finished',
  FAILED = 'failed',
  PENDING = 'pending',
  EXECUTING = 'executing',
  CANCELLED = 'cancelled'
}

export interface Job {
  _id?: string | ObjectId
  createdAt: Date
  type: string
  data?: any
  updatedAt?: Date
  delaySeconds: number
  status: JobStatus
  error?: string
  result?: any
  runAt?: Date
  finishedAt?: Date
  runCount: number
}

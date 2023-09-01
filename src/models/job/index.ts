import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/src/models/mongodb'
import Model from '@/src/models/model'
import { Job as JobInterface, JobStatus } from '@/src/types/job'
import isEmpty from 'lodash.isempty'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class Job extends Model implements JobInterface {
  static TABLE_NAME = 'jobs'
  static JOB_TYPE = 'base'

  _id: ObjectId
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

  private static executingPromise: Promise<void> | null = null

  constructor (job: JobInterface) {
    super()
    this._id = job._id
    this.createdAt = job.createdAt
    this.type = job.type
    this.data = job.data
    this.updatedAt = job.updatedAt
    this.delaySeconds = job.delaySeconds
    this.status = job.status
    this.error = job.error
    this.result = job.result
    this.runAt = job.runAt
    this.finishedAt = job.finishedAt
    this.runCount = job.runCount
  }

  static async createJob (data: Partial<Job>, type: string = this.JOB_TYPE): Promise<ObjectId | null> {
    const { db } = await connectToDatabase()
    const job: JobInterface = {
      _id: new ObjectId(),
      createdAt: new Date(),
      type,
      status: JobStatus.PENDING,
      delaySeconds: 0,
      runCount: 0,
      ...data
    }
    const res = await db.collection(this.TABLE_NAME).insertOne(job)
    return res.result.ok === 1 ? job._id : null
  }

  static async executeJob (job: Job): Promise<void> {
    const { db } = await connectToDatabase()
    job.status = JobStatus.EXECUTING
    job.runAt = new Date()
    await db.collection(this.TABLE_NAME).updateOne(
      { _id: job._id },
      { $set: { status: job.status, runAt: job.runAt } }
    )
    let error = null
    try {
      await job.run()
      if (job.status === JobStatus.EXECUTING) job.status = JobStatus.FINISHED
    } catch (e: any) {
      error = e.message
    }
    await db
      .collection(this.TABLE_NAME)
      .updateOne({ _id: job._id }, {
        $set: {
          status: error != null ? JobStatus.FAILED : (job.status ?? JobStatus.FINISHED),
          error: job.error ?? error,
          result: job.result,
          finishedAt: new Date(),
          runCount: job.runCount + 1
        }
      })
  }

  static async getJobsToExecute (limit: number = 10, page?: string): Promise<{ data: JobInterface[], count: number, page: string, limit: number }> {
    const where: any = {
      $expr: {
        $gt: [
          {
            $dateDiff: {
              startDate: { $toDate: '$createdAt' },
              endDate: new Date(),
              unit: 'second'
            }
          },
          '$delaySeconds'
        ]
      },
      $or: [{ status: JobStatus.PENDING }, { status: JobStatus.FAILED, runCount: { $lt: 3 } }]
    }
    return await this.find(where, limit, this.DEFAULT_SORT, page)
  }

  static async findAndExecuteJobs (): Promise<void> {
    // avoid concurrent executions
    if (this.executingPromise != null) return await this.executingPromise
    // console.log('findAndExecuteJobs: started')
    try {
      this.executingPromise = this._findAndExecuteJobs()
      await this.executingPromise
    } catch (error) {
      console.error('findAndExecuteJobs:', error)
    } finally {
      this.executingPromise = null
    }
  }

  private static async _findAndExecuteJobs (): Promise<void> {
    let jobsResult = await this.getJobsToExecute()
    while (!isEmpty(jobsResult?.data)) {
      const { jobFactory } = await import('@/src/models/job/job-factory') // dynamic import to avoid circular dependency
      const jobs = jobsResult.data
      const promises = jobs.map(async (job) => {
        const jobInstance = jobFactory(job)
        return await this.executeJob(jobInstance)
      })
      await Promise.all(promises)
      if (!isEmpty(jobsResult.page)) jobsResult = await this.getJobsToExecute(jobsResult.limit, jobsResult.page)
      else break
    }
  }

  async run (): Promise<boolean> {
    throw new Error('Not implemented')
  }
}

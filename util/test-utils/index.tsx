import React from 'react'
import { render, renderHook, act, RenderResult, Queries } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from '@/pages/_app'
import { I18nextProvider, useTranslation, initReactI18next } from 'react-i18next'
import i18n from 'i18next'
// import { createConfig } from 'next-i18next/dist/commonjs/config/createConfig'
// import { createConfig } from 'next-i18next/dist/types/config/createConfig'
import i18NextConfig from '../../next-i18next.config'
import i18nextFSBackend from 'i18next-fs-backend'
import { faker } from '@faker-js/faker'
import { createUser, updateDeletionFields } from '@/src/models/user'
import { createProject, getProject, createProjectWithDefaultColumnsAndCardsAndActivity } from '@/src/models/project'
import { User } from '@/src/types/user'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connectToDatabase } from '@/src/models/mongodb'
import { Db, MongoClient } from 'mongodb'
import { hashPassword } from '@/util/auth'
import { encode } from 'next-auth/jwt'
import industries from '@/src/data/industries.json'
import { Project } from '@/src/types/project'
import { dataToCards } from '@/src/models/card'
import { defaultCards, defaultRoles } from '@/src/data'
import { addRoles } from '@/src/models/role'
import { upsertNotificationSetting } from '@/src/models/notification-setting'
import { NotificationSetting } from '@/src/types/notification-setting'
import { MAX_USER_AGED_DAYS, daysToMilliseconds } from '@/util/index'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createConfig } = require('next-i18next/dist/commonjs/config/createConfig')

const { JWT_SECRET_KEY } = process.env

const RealDate = Date

const namespaces = [
  'api-messages',
  'buttons',
  'cookies',
  'column-dashboard',
  'common',
  'dialogs',
  'exceptions',
  'filter-sort',
  'img-input',
  'links',
  'login',
  'navbar',
  'placeholders',
  'project-settings',
  'projects',
  'reset-password',
  'settings',
  'sidebar',
  'signup',
  'titles',
  'validations',
  'front-page'
]

let initTranslationPromise: Promise<void> | null = null

export const initTranslations = async (): Promise<void> => {
  if (initTranslationPromise != null) return await initTranslationPromise
  else {
    const locale = i18NextConfig.i18n.defaultLocale
    const i18Config = createConfig({ ...i18NextConfig, lng: locale } as any)
    await i18n.use(initReactI18next).use(i18nextFSBackend).init({
      ...i18Config,
      debug: false,
      preload: ['en', 'fr', 'nl']
    })
    await new Promise(resolve => i18n.loadResources(resolve))
    initTranslationPromise = new Promise(resolve => {
      void i18n.loadNamespaces(namespaces, resolve)
    })
    return await initTranslationPromise
  }
}

export const renderWithThemeAndTranslations = async (ui: JSX.Element, locale = 'en'): Promise<RenderResult<Queries, HTMLElement, HTMLElement>> => {
  await initTranslations()
  const t = renderHook(() => useTranslation())
  await act(async () => {
    await t.result.current.i18n.changeLanguage(locale)
  })
  const Wrapper = ({ children }: { children: any }): JSX.Element => {
    return (
      <ChakraProvider theme={theme}><I18nextProvider i18n={t.result.current.i18n}>{children}</I18nextProvider></ChakraProvider>
    )
  }
  return render(ui, { wrapper: Wrapper })
}

export const setupMongoDB = (): { mongoServer: MongoMemoryServer | null, client: MongoClient | null } => {
  const context: { mongoServer: MongoMemoryServer | null, client: MongoClient | null, db: Db | null } = {
    mongoServer: null,
    client: null,
    db: null
  }
  beforeAll(async () => {
    // https://dev.to/remrkabledev/testing-with-mongodb-memory-server-4ja2
    context.mongoServer = await MongoMemoryServer.create()
    const uri = context.mongoServer.getUri()
    const { client, db } = await connectToDatabase(uri, faker.random.alphaNumeric(10))
    context.client = client
    context.db = db
  })
  // beforeEach(async () => {
  //   await context.client?.db().dropDatabase()
  // })
  afterEach(async () => {
    await context.db?.dropDatabase()
    await context.client?.db().dropDatabase()
  })
  afterAll(async () => {
    await context.client?.close()
    await context.mongoServer?.stop()
  })
  return context
}

export const givenAPassword = (length: number = 10, prefix: string = 'P@ssw0rd'): string => {
  return faker.internet.password(length, undefined, undefined, prefix)
}

export const givenUserData = (data: any = {}): Partial<User> => {
  return {
    email: faker.internet.email(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    password: givenAPassword(),
    emailVerified: true,
    ...data
  }
}

export const givenProjectData = (data: any = {}): Partial<Project> => {
  return {
    name: faker.internet.userName(),
    description: faker.lorem.paragraph(),
    industryId: faker.helpers.arrayElement(industries)._id,
    ...data
  }
}

export const givenAUser = async (data: any = {}): Promise<User> => {
  const user = givenUserData(data) as User
  // console.log('givenAUser', user)
  const hashedPassword = await hashPassword(String(user.password))
  if (data.createdAt != null) setDateContructorToDate(data.createdAt)
  const createdUser = await createUser({ ...user, password: hashedPassword })
  if (data.createdAt != null) resetDateConstructor()
  let deleteNotificationSentDate = null
  let deletePreventionDate = null
  if (data.deleteNotificationSentDate != null) deleteNotificationSentDate = data.deleteNotificationSentDate
  if (data.deletePreventionDate != null) deletePreventionDate = data.deletePreventionDate
  if (deleteNotificationSentDate != null || deletePreventionDate != null) await updateDeletionFields(String(createdUser._id), deletePreventionDate, deleteNotificationSentDate)
  return { ...createdUser, password: user.password }
}

export const givenAUserWithDeleteNotificationSentPastMaxTime = async (data: any = {}): Promise<User> => {
  if (data.createdAt == null) data.createdAt = new Date(Date.now() - daysToMilliseconds(300))
  if (data.deleteNotificationSentDate == null) data.deleteNotificationSentDate = new Date(new Date(Date.now() - daysToMilliseconds(MAX_USER_AGED_DAYS + 4)).setHours(0, 0, 0, 0))
  return await givenAUser(data)
}

export const givenAUserWithDeleteNotificationSentAndDeletePreventionDatePastMaxtime = async (data: any = {}): Promise<User> => {
  if (data.createdAt == null) data.createdAt = new Date(Date.now() - daysToMilliseconds(300))
  if (data.deleteNotificationSentDate == null) data.deleteNotificationSentDate = new Date(new Date(Date.now() - daysToMilliseconds(MAX_USER_AGED_DAYS + 4)).setHours(0, 0, 0, 0))
  if (data.deletePreventionDate == null) data.deletePreventionDate = new Date(new Date(Date.now() - daysToMilliseconds(MAX_USER_AGED_DAYS + 1)).setHours(0, 0, 0, 0))
  return await givenAUser(data)
}

export const givenAUserAcceptingNotifications = async (userData: Partial<User> = {}, notificationData: Partial<NotificationSetting> = { projectActivity: true, mentions: true }): Promise<User> => {
  const user = await givenAUser(userData)
  if (user?._id == null) throw new Error('User not created')
  await upsertNotificationSetting({ mentions: true, projectActivity: true, ...notificationData, _id: user._id })
  return user
}

export const givenMultipleUsers = async (count: number, data = {}): Promise<User[]> => {
  const users = []
  for (let i = 0; i < count; i++) {
    users.push(givenAUser(data))
  }
  return await Promise.all(users)
}

export const givenAProject = async (data = {}, user: User | undefined, withCardsAndRoles: boolean = false): Promise<Project> => {
  if (user == null) user = await givenAUser()
  if (user?._id == null) throw new Error('User not created')
  const project = givenProjectData(data) as Project
  let projectId = null
  if (withCardsAndRoles) {
    const cardsData = await dataToCards(defaultCards)
    projectId = await createProjectWithDefaultColumnsAndCardsAndActivity(
      { ...project, createdBy: user._id },
      cardsData,
      String(user._id)
    )
    await addRoles(projectId, defaultRoles)
  } else {
    projectId = await createProject({ ...project, createdBy: user._id })
  }
  return await getProject(projectId)
}

export const givenMultipleProjects = async (count: number, data = {}, user: User | undefined): Promise<Project[]> => {
  const projects = []
  for (let i = 0; i < count; i++) {
    projects.push(givenAProject(data, user))
  }
  return await Promise.all(projects)
}

export const givenAnAuthenticationToken = async (user: User, secret: string = String(JWT_SECRET_KEY)): Promise<string> => {
  const tokenData = { sub: String(user._id), email: user.email, name: String(user._id) }
  const token = await encode({
    secret,
    token: tokenData
  })
  return token
}

export const givenCommentTextData = (users: User[]): string => {
  let commentText = faker.lorem.paragraph()
  // creates a string of users to be tagged in the comment
  for (const user of users) {
    commentText = `${commentText} @[${user.firstName} ${user.lastName}](${String(user._id)})`
  }
  return `${commentText} ${faker.lorem.paragraph()}`
}

export const setDateContructorToDate = (date: Date): void => {
  (global as any).Date = class extends RealDate {
    constructor () {
      super()
      return date
    }
  }
}

export const resetDateConstructor = (): void => {
  (global as any).Date = RealDate
}

import { mongoMigrateCli } from 'mongo-migrate-ts'
import isEmpty from 'lodash.isempty'
// The below can be used in a Jest global setup file or similar for your testing set-up
import { loadEnvConfig } from '@next/env'

const projectDir = `${process.cwd()}`
console.log('projectDir:', projectDir)
loadEnvConfig(projectDir)
const { MONGODB_URI } = process.env

if (isEmpty(MONGODB_URI)) {
  throw new Error('Please define the MONGODB_URI environment variable inside the .env files')
}

mongoMigrateCli({
  uri: String(MONGODB_URI),
  migrationsDir: __dirname,
  migrationsCollection: 'migrations_collection'
})

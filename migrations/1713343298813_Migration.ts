import { Db } from 'mongodb'
import { MigrationInterface } from 'mongo-migrate-ts'

export class Migration1713343298813 implements MigrationInterface {
  public async up (db: Db): Promise<any> {
    console.log('Migration1713343298813.up()')
  }

  public async down (db: Db): Promise<any> {
  }
}

import { Db } from 'mongodb'
import { MigrationInterface } from 'mongo-migrate-ts';

export class Migration1713343362934 implements MigrationInterface {
  public async up(db: Db): Promise<any> {
    console.log('Migration1713343362934.up()')
  }

  public async down(db: Db): Promise<any> {
  }
}

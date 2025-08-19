/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Module } from '@nestjs/common';
import {
  DRIZZLE_DB,
  MAILER_SERVICE,
  PASSWORD_HASHER,
  USER_REPOSITORY,
} from '../../domain/tokens';
import { DrizzleService } from './providers/drizzle.service';
import { UserDrizzleRepository } from '../repositories/user.drizzle.repository';
import { BcryptPasswordHasher } from '../services/bcrypt-password-hasher';
import { NodemailerMailerService } from '../services/nodemailer-mailer.service';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Module({
  imports: [],
  providers: [
    DrizzleService,
    {
      provide: DRIZZLE_DB,
      useFactory: (drizzle: DrizzleService): NodePgDatabase => drizzle.db,
      inject: [DrizzleService],
    },
    {
      provide: USER_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new UserDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: MAILER_SERVICE,
      useClass: NodemailerMailerService,
    },
  ],
  exports: [DRIZZLE_DB, USER_REPOSITORY, PASSWORD_HASHER, MAILER_SERVICE],
})
export class InfrastructureModule {}

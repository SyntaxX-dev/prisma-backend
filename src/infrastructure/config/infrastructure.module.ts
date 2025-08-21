/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Module } from '@nestjs/common';
import {
  DRIZZLE_DB,
  PASSWORD_HASHER,
  USER_REPOSITORY,
  PASSWORD_RESET_SERVICE,
} from '../../domain/tokens';
import { DrizzleService } from './providers/drizzle.service';
import { UserDrizzleRepository } from '../repositories/user.drizzle.repository';
import { BcryptPasswordHasher } from '../services/bcrypt-password-hasher';
import { EmailModule } from '../email/email.module';
import { PasswordResetServiceImpl } from '../services/password-reset.service';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Module({
  imports: [EmailModule],
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
      provide: PASSWORD_RESET_SERVICE,
      useClass: PasswordResetServiceImpl,
    },
  ],
  exports: [
    DRIZZLE_DB,
    USER_REPOSITORY,
    PASSWORD_HASHER,
    PASSWORD_RESET_SERVICE,
  ],
})
export class InfrastructureModule {}

import { Inject, Injectable } from '@nestjs/common';
import { eq, lt } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../domain/tokens';
import type { RegistrationTokenRepository } from '../../domain/repositories/registration-token.repository';
import { RegistrationToken } from '../../domain/entities/registration-token';
import { registrationTokens } from '../database/schema';

type DrizzleDb = {
  select: () => any;
  insert: (table: any) => any;
  update: (table: any) => any;
  delete: (table: any) => any;
};

/**
 * Implementação do repositório de tokens de registro usando Drizzle
 */
@Injectable()
export class RegistrationTokenRepositoryImpl
  implements RegistrationTokenRepository
{
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  /**
   * Mapeia os dados do banco para a entidade
   */
  private mapToEntity(data: any): RegistrationToken {
    return new RegistrationToken(
      data.id,
      data.subscriptionId,
      data.token,
      data.email,
      data.isUsed === 'true',
      data.usedAt ? new Date(data.usedAt) : null,
      new Date(data.expiresAt),
      new Date(data.createdAt),
    );
  }

  async create(token: RegistrationToken): Promise<RegistrationToken> {
    const [result] = await this.db
      .insert(registrationTokens)
      .values({
        id: token.id,
        subscriptionId: token.subscriptionId,
        token: token.token,
        email: token.email,
        isUsed: token.isUsed ? 'true' : 'false',
        usedAt: token.usedAt,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async findByToken(token: string): Promise<RegistrationToken | null> {
    const [result] = await this.db
      .select()
      .from(registrationTokens)
      .where(eq(registrationTokens.token, token))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async findBySubscriptionId(
    subscriptionId: string,
  ): Promise<RegistrationToken | null> {
    const [result] = await this.db
      .select()
      .from(registrationTokens)
      .where(eq(registrationTokens.subscriptionId, subscriptionId))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async findByEmail(email: string): Promise<RegistrationToken | null> {
    const [result] = await this.db
      .select()
      .from(registrationTokens)
      .where(eq(registrationTokens.email, email))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async markAsUsed(token: string): Promise<RegistrationToken> {
    const [result] = await this.db
      .update(registrationTokens)
      .set({
        isUsed: 'true',
        usedAt: new Date(),
      })
      .where(eq(registrationTokens.token, token))
      .returning();

    return this.mapToEntity(result);
  }

  async update(token: RegistrationToken): Promise<RegistrationToken> {
    const [result] = await this.db
      .update(registrationTokens)
      .set({
        isUsed: token.isUsed ? 'true' : 'false',
        usedAt: token.usedAt,
      })
      .where(eq(registrationTokens.id, token.id))
      .returning();

    return this.mapToEntity(result);
  }

  async removeExpired(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(registrationTokens)
      .where(lt(registrationTokens.expiresAt, now))
      .returning();

    return result.length;
  }
}


import { Inject, Injectable } from '@nestjs/common';
import { eq, and, lt, sql } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../domain/tokens';
import type { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { Subscription, SubscriptionStatus, PaymentMethod } from '../../domain/entities/subscription';
import { subscriptions } from '../database/schema';
import type { PlanType } from '../asaas/constants/plans.constants';

type DrizzleDb = {
  select: () => any;
  insert: (table: any) => any;
  update: (table: any) => any;
  delete: (table: any) => any;
};

/**
 * Implementação do repositório de assinaturas usando Drizzle
 */
@Injectable()
export class SubscriptionRepositoryImpl implements SubscriptionRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) { }

  /**
   * Mapeia os dados do banco para a entidade
   */
  private mapToEntity(data: any): Subscription {
    return new Subscription(
      data.id,
      data.userId,
      data.asaasCustomerId,
      data.asaasSubscriptionId,
      data.plan as PlanType,
      data.status as SubscriptionStatus,
      data.paymentMethod as PaymentMethod | null,
      data.currentPrice,
      data.pendingPlanChange as PlanType | null,
      data.pendingPlanChangeCreatedAt ? new Date(data.pendingPlanChangeCreatedAt) : null,
      data.startDate ? new Date(data.startDate) : null,
      data.currentPeriodStart ? new Date(data.currentPeriodStart) : null,
      data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
      data.cancelledAt ? new Date(data.cancelledAt) : null,
      data.customerEmail,
      data.customerName,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }

  async create(subscription: Subscription): Promise<Subscription> {
    const [result] = await this.db
      .insert(subscriptions)
      .values({
        id: subscription.id,
        userId: subscription.userId,
        asaasCustomerId: subscription.asaasCustomerId,
        asaasSubscriptionId: subscription.asaasSubscriptionId,
        plan: subscription.plan,
        status: subscription.status,
        paymentMethod: subscription.paymentMethod,
        currentPrice: subscription.currentPrice,
        pendingPlanChange: subscription.pendingPlanChange,
        pendingPlanChangeCreatedAt: subscription.pendingPlanChangeCreatedAt,
        startDate: subscription.startDate,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        customerEmail: subscription.customerEmail,
        customerName: subscription.customerName,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<Subscription | null> {
    const [result] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const [result] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async findByCustomerEmail(email: string): Promise<Subscription | null> {
    const [result] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.customerEmail, email))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async findByAsaasCustomerId(
    asaasCustomerId: string,
  ): Promise<Subscription | null> {
    const [result] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.asaasCustomerId, asaasCustomerId))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<Subscription | null> {
    const [result] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.asaasSubscriptionId, asaasSubscriptionId))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const [result] = await this.db
      .update(subscriptions)
      .set({
        userId: subscription.userId,
        asaasSubscriptionId: subscription.asaasSubscriptionId,
        plan: subscription.plan,
        status: subscription.status,
        paymentMethod: subscription.paymentMethod,
        currentPrice: subscription.currentPrice,
        pendingPlanChange: subscription.pendingPlanChange,
        pendingPlanChangeCreatedAt: subscription.pendingPlanChangeCreatedAt,
        startDate: subscription.startDate,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    return this.mapToEntity(result);
  }

  async findActiveSubscriptions(): Promise<Subscription[]> {
    const results = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ACTIVE'));

    return results.map((r: any) => this.mapToEntity(r));
  }

  async findByStatus(
    status: 'PENDING' | 'ACTIVE' | 'OVERDUE' | 'CANCELLED' | 'EXPIRED',
  ): Promise<Subscription[]> {
    const results = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, status));

    return results.map((r: any) => this.mapToEntity(r));
  }

  async findPendingSubscriptionsOlderThan(hours: number): Promise<Subscription[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const results = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'PENDING'),
          lt(subscriptions.createdAt, cutoffDate),
        ),
      );

    return results.map((r: any) => this.mapToEntity(r));
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(subscriptions)
      .where(eq(subscriptions.id, id));
  }
}


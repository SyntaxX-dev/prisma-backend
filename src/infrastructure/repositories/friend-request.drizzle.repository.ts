import { eq, and, or } from 'drizzle-orm';
import { friendRequests } from '../database/schema';
import type { FriendRequestRepository } from '../../domain/repositories/friend-request.repository';
import { FriendRequest } from '../../domain/entities/friend-request';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { FriendRequestStatus } from '../../domain/enums/friend-request-status';

export class FriendRequestDrizzleRepository implements FriendRequestRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(requesterId: string, receiverId: string): Promise<FriendRequest> {
    const [created] = await this.db
      .insert(friendRequests)
      .values({
        requesterId,
        receiverId,
        status: FriendRequestStatus.PENDING,
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<FriendRequest | null> {
    const [request] = await this.db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.id, id));

    if (!request) return null;

    return this.mapToEntity(request);
  }

  async findByRequesterAndReceiver(
    requesterId: string,
    receiverId: string,
  ): Promise<FriendRequest | null> {
    const [request] = await this.db
      .select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.requesterId, requesterId),
          eq(friendRequests.receiverId, receiverId),
        ),
      );

    if (!request) return null;

    return this.mapToEntity(request);
  }

  async findByReceiverId(
    receiverId: string,
    status?: FriendRequestStatus,
  ): Promise<FriendRequest[]> {
    const conditions = [eq(friendRequests.receiverId, receiverId)];
    if (status) {
      conditions.push(eq(friendRequests.status, status));
    }

    const requests = await this.db
      .select()
      .from(friendRequests)
      .where(and(...conditions))
      .orderBy(friendRequests.createdAt);

    return requests.map((r) => this.mapToEntity(r));
  }

  async findByRequesterId(
    requesterId: string,
    status?: FriendRequestStatus,
  ): Promise<FriendRequest[]> {
    const conditions = [eq(friendRequests.requesterId, requesterId)];
    if (status) {
      conditions.push(eq(friendRequests.status, status));
    }

    const requests = await this.db
      .select()
      .from(friendRequests)
      .where(and(...conditions))
      .orderBy(friendRequests.createdAt);

    return requests.map((r) => this.mapToEntity(r));
  }

  async updateStatus(id: string, status: FriendRequestStatus): Promise<void> {
    await this.db
      .update(friendRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(friendRequests.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(friendRequests).where(eq(friendRequests.id, id));
  }

  private mapToEntity(row: any): FriendRequest {
    return new FriendRequest(
      row.id,
      row.requesterId,
      row.receiverId,
      row.status as FriendRequestStatus,
      row.createdAt,
      row.updatedAt,
    );
  }
}


import { FriendRequest } from '../entities/friend-request';
import { FriendRequestStatus } from '../enums/friend-request-status';

export interface FriendRequestRepository {
  create(requesterId: string, receiverId: string): Promise<FriendRequest>;
  findById(id: string): Promise<FriendRequest | null>;
  findByRequesterAndReceiver(
    requesterId: string,
    receiverId: string,
  ): Promise<FriendRequest | null>;
  findByReceiverId(
    receiverId: string,
    status?: FriendRequestStatus,
  ): Promise<FriendRequest[]>;
  findByRequesterId(
    requesterId: string,
    status?: FriendRequestStatus,
  ): Promise<FriendRequest[]>;
  updateStatus(id: string, status: FriendRequestStatus): Promise<void>;
  delete(id: string): Promise<void>;
}

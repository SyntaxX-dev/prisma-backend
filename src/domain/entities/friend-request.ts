import { FriendRequestStatus } from '../enums/friend-request-status';

export class FriendRequest {
  constructor(
    public readonly id: string,
    public readonly requesterId: string,
    public readonly receiverId: string,
    public status: FriendRequestStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}


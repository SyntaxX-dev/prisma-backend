import { Friendship } from '../entities/friendship';

export interface FriendshipRepository {
  create(userId1: string, userId2: string): Promise<Friendship>;
  findById(id: string): Promise<Friendship | null>;
  findByUsers(userId1: string, userId2: string): Promise<Friendship | null>;
  findByUserId(userId: string): Promise<Friendship[]>;
  delete(userId1: string, userId2: string): Promise<void>;
}


import { Block } from '../entities/block';

export interface BlockRepository {
  create(blockerId: string, blockedId: string): Promise<Block>;
  findById(id: string): Promise<Block | null>;
  findByBlockerAndBlocked(
    blockerId: string,
    blockedId: string,
  ): Promise<Block | null>;
  findByBlockerId(blockerId: string): Promise<Block[]>;
  findByBlockedId(blockedId: string): Promise<Block[]>;
  delete(blockerId: string, blockedId: string): Promise<void>;
}

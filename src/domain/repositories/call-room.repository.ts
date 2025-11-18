import { CallRoom } from '../entities/call-room';

export interface CallRoomRepository {
  create(callerId: string, receiverId: string): Promise<CallRoom>;
  findById(id: string): Promise<CallRoom | null>;
  findByUsers(userId1: string, userId2: string, limit?: number): Promise<CallRoom[]>;
  updateStatus(id: string, status: 'ringing' | 'active' | 'ended' | 'rejected' | 'missed'): Promise<void>;
  updateAnsweredAt(id: string, answeredAt: Date): Promise<void>;
  updateEndedAt(id: string, endedAt: Date, duration: number): Promise<void>;
}


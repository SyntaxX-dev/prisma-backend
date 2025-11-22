import { User } from '../entities/user';

export interface MindMapLimitInfo {
  generationsToday: number;
  dailyLimit: number;
  remainingGenerations: number;
  canGenerate: boolean;
}

export interface UserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  updateProfile(userId: string, profileData: Partial<User>): Promise<void>;
  // Mind Map Limit Methods
  getMindMapLimitInfo(userId: string): Promise<MindMapLimitInfo>;
  incrementMindMapGeneration(userId: string): Promise<void>;
}

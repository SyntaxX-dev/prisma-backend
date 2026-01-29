import { User } from '../entities/user';

export type GenerationType = 'mindmap' | 'text';

export interface GenerationLimitInfo {
  generationsToday: number;
  dailyLimit: number;
  remainingGenerations: number;
  canGenerate: boolean;
  resetTime?: string; // ISO string do horário de reset (meia-noite do próximo dia)
}

export interface AllLimitsInfo {
  mindmap: GenerationLimitInfo;
  text: GenerationLimitInfo;
}

export interface UserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  updateProfile(userId: string, profileData: Partial<User>): Promise<void>;
  // Generation Limit Methods
  getGenerationLimitInfo(userId: string, type: GenerationType): Promise<GenerationLimitInfo>;
  getAllLimitsInfo(userId: string): Promise<AllLimitsInfo>;
  incrementGeneration(userId: string, type: GenerationType): Promise<void>;
}

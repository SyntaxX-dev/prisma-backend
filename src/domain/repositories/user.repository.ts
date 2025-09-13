import { User } from '../entities/user';

export interface UserRepository {
  create(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  updateProfile(userId: string, profileData: Partial<User>): Promise<void>;
}

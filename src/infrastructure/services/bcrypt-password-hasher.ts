import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../domain/services/password-hasher';

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

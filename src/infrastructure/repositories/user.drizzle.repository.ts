import { eq } from 'drizzle-orm';
import { users } from '../database/schema';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { User } from '../../domain/entities/user';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { UserRole } from '../../domain/enums/user-role';
import { EducationLevel } from '../../domain/enums/education-level';

export class UserDrizzleRepository implements UserRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(user: User): Promise<User> {
    await this.db.insert(users).values({
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      age: user.age,
      role: user.role,
      educationLevel: user.educationLevel,
      createdAt: user.createdAt,
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const role = row.role ? UserRole[row.role as keyof typeof UserRole] : null;
    const educationLevel = row.educationLevel ? EducationLevel[row.educationLevel] : null;

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      age: row.age,
      role,
      educationLevel,
      createdAt: row.createdAt,
    };
    return user;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.id, userId));
  }
}

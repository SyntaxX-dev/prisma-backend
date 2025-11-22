import { eq } from 'drizzle-orm';
import { users } from '../database/schema';
import type {
  UserRepository,
  MindMapLimitInfo,
} from '../../domain/repositories/user.repository';
import type { User } from '../../domain/entities/user';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { UserRole } from '../../domain/enums/user-role';
import { EducationLevel } from '../../domain/enums/education-level';
import { UserFocus } from '../../domain/enums/user-focus';
import { ContestType } from '../../domain/enums/contest-type';
import { CollegeCourse } from '../../domain/enums/college-course';

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
      userFocus: user.userFocus,
      contestType: user.contestType,
      collegeCourse: user.collegeCourse,
      badge: user.badge,
      isProfileComplete: user.isProfileComplete.toString(),
      // Novos campos do perfil
      profileImage: user.profileImage,
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio,
      aboutYou: user.aboutYou,
      habilities: user.habilities,
      momentCareer: user.momentCareer,
      location: user.location,
      instagram: user.instagram,
      twitter: user.twitter,
      socialLinksOrder: user.socialLinksOrder,
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
    const educationLevel = row.educationLevel
      ? EducationLevel[row.educationLevel]
      : null;
    const userFocus = row.userFocus
      ? UserFocus[row.userFocus as keyof typeof UserFocus]
      : null;
    const contestType = row.contestType
      ? ContestType[row.contestType as keyof typeof ContestType]
      : null;
    const collegeCourse = row.collegeCourse
      ? CollegeCourse[row.collegeCourse as keyof typeof CollegeCourse]
      : null;

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      age: row.age,
      role,
      educationLevel,
      userFocus,
      contestType,
      collegeCourse,
      badge: row.badge,
      isProfileComplete: row.isProfileComplete === 'true',
      // Novos campos do perfil
      profileImage: row.profileImage,
      linkedin: row.linkedin,
      github: row.github,
      portfolio: row.portfolio,
      aboutYou: row.aboutYou,
      habilities: row.habilities,
      momentCareer: row.momentCareer,
      location: row.location,
      instagram: row.instagram,
      twitter: row.twitter,
      socialLinksOrder: row.socialLinksOrder,
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

  async updateProfile(
    userId: string,
    profileData: Partial<User>,
  ): Promise<void> {
    await this.db
      .update(users)
      .set({
        name: profileData.name,
        age: profileData.age,
        role: profileData.role,
        educationLevel: profileData.educationLevel,
        userFocus: profileData.userFocus,
        contestType: profileData.contestType,
        collegeCourse: profileData.collegeCourse,
        badge: profileData.badge,
        isProfileComplete: profileData.isProfileComplete?.toString(),
        // Novos campos do perfil
        profileImage: profileData.profileImage,
        linkedin: profileData.linkedin,
        github: profileData.github,
        portfolio: profileData.portfolio,
        aboutYou: profileData.aboutYou,
        habilities: profileData.habilities,
        momentCareer: profileData.momentCareer,
        location: profileData.location,
        instagram: profileData.instagram,
        twitter: profileData.twitter,
        socialLinksOrder: profileData.socialLinksOrder,
      })
      .where(eq(users.id, userId));
  }

  async findById(userId: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const role = row.role ? UserRole[row.role as keyof typeof UserRole] : null;
    const educationLevel = row.educationLevel
      ? EducationLevel[row.educationLevel]
      : null;
    const userFocus = row.userFocus
      ? UserFocus[row.userFocus as keyof typeof UserFocus]
      : null;
    const contestType = row.contestType
      ? ContestType[row.contestType as keyof typeof ContestType]
      : null;
    const collegeCourse = row.collegeCourse
      ? CollegeCourse[row.collegeCourse as keyof typeof CollegeCourse]
      : null;

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      age: row.age,
      role,
      educationLevel,
      userFocus,
      contestType,
      collegeCourse,
      badge: row.badge,
      isProfileComplete: row.isProfileComplete === 'true',
      // Novos campos do perfil
      profileImage: row.profileImage,
      linkedin: row.linkedin,
      github: row.github,
      portfolio: row.portfolio,
      aboutYou: row.aboutYou,
      habilities: row.habilities,
      momentCareer: row.momentCareer,
      location: row.location,
      instagram: row.instagram,
      twitter: row.twitter,
      socialLinksOrder: row.socialLinksOrder,
      createdAt: row.createdAt,
    };
    return user;
  }

  async findByName(name: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.name, name))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const role = row.role ? UserRole[row.role as keyof typeof UserRole] : null;
    const educationLevel = row.educationLevel
      ? EducationLevel[row.educationLevel]
      : null;
    const userFocus = row.userFocus
      ? UserFocus[row.userFocus as keyof typeof UserFocus]
      : null;
    const contestType = row.contestType
      ? ContestType[row.contestType as keyof typeof ContestType]
      : null;
    const collegeCourse = row.collegeCourse
      ? CollegeCourse[row.collegeCourse as keyof typeof CollegeCourse]
      : null;

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      age: row.age,
      role,
      educationLevel,
      userFocus,
      contestType,
      collegeCourse,
      badge: row.badge,
      isProfileComplete: row.isProfileComplete === 'true',
      // Novos campos do perfil
      profileImage: row.profileImage,
      linkedin: row.linkedin,
      github: row.github,
      portfolio: row.portfolio,
      aboutYou: row.aboutYou,
      habilities: row.habilities,
      momentCareer: row.momentCareer,
      location: row.location,
      instagram: row.instagram,
      twitter: row.twitter,
      socialLinksOrder: row.socialLinksOrder,
      createdAt: row.createdAt,
    };
    return user;
  }

  async getMindMapLimitInfo(userId: string): Promise<MindMapLimitInfo> {
    const rows = await this.db
      .select({
        generationsToday: users.mindMapGenerationsToday,
        dailyLimit: users.mindMapDailyLimit,
        lastResetDate: users.mindMapLastResetDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se precisa resetar o contador (novo dia)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let generationsToday = row.generationsToday;
    const lastReset = row.lastResetDate ? new Date(row.lastResetDate) : null;

    if (!lastReset || lastReset < today) {
      // É um novo dia, resetar contador
      generationsToday = 0;
      await this.db
        .update(users)
        .set({
          mindMapGenerationsToday: 0,
          mindMapLastResetDate: today,
        })
        .where(eq(users.id, userId));
    }

    const remainingGenerations = Math.max(0, row.dailyLimit - generationsToday);

    return {
      generationsToday,
      dailyLimit: row.dailyLimit,
      remainingGenerations,
      canGenerate: remainingGenerations > 0,
    };
  }

  async incrementMindMapGeneration(userId: string): Promise<void> {
    const rows = await this.db
      .select({
        generationsToday: users.mindMapGenerationsToday,
        lastResetDate: users.mindMapLastResetDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new Error('Usuário não encontrado');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastReset = row.lastResetDate ? new Date(row.lastResetDate) : null;

    if (!lastReset || lastReset < today) {
      // É um novo dia, resetar e começar com 1
      await this.db
        .update(users)
        .set({
          mindMapGenerationsToday: 1,
          mindMapLastResetDate: today,
        })
        .where(eq(users.id, userId));
    } else {
      // Mesmo dia, incrementar
      await this.db
        .update(users)
        .set({
          mindMapGenerationsToday: row.generationsToday + 1,
        })
        .where(eq(users.id, userId));
    }
  }
}

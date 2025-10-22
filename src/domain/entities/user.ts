import { EducationLevel } from '../enums/education-level';
import { UserRole } from '../enums/user-role';
import { UserFocus } from '../enums/user-focus';
import { ContestType } from '../enums/contest-type';
import { CollegeCourse } from '../enums/college-course';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public passwordHash: string,
    public age: number | null,
    public role: UserRole | null,
    public educationLevel: EducationLevel | null,
    public userFocus: UserFocus | null,
    public contestType: ContestType | null,
    public collegeCourse: CollegeCourse | null,
    public badge: string | null,
    public isProfileComplete: boolean,
    // Novos campos do perfil
    public profileImage: string | null,
    public linkedin: string | null,
    public github: string | null,
    public portfolio: string | null,
    public aboutYou: string | null,
    public habilities: string | null,
    public momentCareer: string | null,
    public location: string | null,
    public instagram: string | null,
    public twitter: string | null,
    public readonly createdAt: Date = new Date(),
  ) {}
}

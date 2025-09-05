import { EducationLevel } from '../enums/education-level';
import { UserRole } from '../enums/user-role';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public passwordHash: string,
    public age: number | null,
    public role: UserRole | null,
    public educationLevel: EducationLevel | null,
    public readonly createdAt: Date = new Date(),
  ) {}
}

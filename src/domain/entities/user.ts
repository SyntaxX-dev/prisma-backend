import { EducationLevel } from '../enums/education-level';
import { UserRole } from '../enums/user-role';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public passwordHash: string,
    public age: number,
    public role: UserRole,
    public educationLevel: EducationLevel,
    public readonly createdAt: Date = new Date(),
  ) {}
}

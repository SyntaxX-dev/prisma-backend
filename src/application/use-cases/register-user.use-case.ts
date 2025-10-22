import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  MAILER_SERVICE,
} from '../../domain/tokens';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { MailerServicePort } from '../../domain/services/mailer';
import { User } from '../../domain/entities/user';
import { UserRole } from '../../domain/enums/user-role';
import { EducationLevel } from '../../domain/enums/education-level';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  educationLevel: EducationLevel;
}

export interface RegisterUserOutput {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  educationLevel: EducationLevel | null;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(MAILER_SERVICE) private readonly mailer: MailerServicePort,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const { name, email, password, confirmPassword, age, educationLevel } =
      input;

    if (password !== confirmPassword) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado');
    }

    const passwordHash = await this.passwordHasher.hash(password);

    const user = new User(
      uuidv4(),
      name,
      email,
      passwordHash,
      age,
      UserRole.STUDENT,
      educationLevel,
      null, // userFocus
      null, // contestType
      null, // collegeCourse
      null, // badge
      false, // isProfileComplete
      // Novos campos do perfil
      null, // profileImage
      null, // linkedin
      null, // github
      null, // portfolio
      null, // aboutYou
      null, // habilities
      null, // momentCareer
      null, // location
      null, // instagram
      null, // twitter
      null, // socialLinksOrder
    );

    await this.userRepository.create(user);
    await this.mailer.sendWelcomeEmail(user.email, user.name);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      educationLevel: user.educationLevel,
    };
  }
}

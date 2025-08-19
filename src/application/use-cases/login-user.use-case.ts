import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, PASSWORD_HASHER } from '../../domain/tokens';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  message: string;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return { message: 'Login realizado com sucesso' };
  }
}

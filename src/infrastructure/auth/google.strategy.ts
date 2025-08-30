import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AUTH_SERVICE, USER_REPOSITORY } from '../../domain/tokens';
import type { AuthService } from '../../domain/services/auth.service';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { UserRole } from '../../domain/enums/user-role';
import { EducationLevel } from '../../domain/enums/education-level';
import { randomUUID } from 'crypto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.name?.givenName || 'Usuário';

    if (!email) {
      throw new Error('Email não disponível pelo Google OAuth');
    }

    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Criar usuário mínimo (sem senha) na primeira autenticação
      user = {
        id: randomUUID(),
        name,
        email,
        passwordHash: '',
        age: 18,
        role: UserRole.STUDENT,
        educationLevel: EducationLevel.HIGH_SCHOOL,
        createdAt: new Date(),
      };
      await this.userRepository.create(user);
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.authService.generateToken(payload);

    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
} 

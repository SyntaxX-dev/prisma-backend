import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import {
  AUTH_SERVICE,
  USER_REPOSITORY,
  GOOGLE_CONFIG_SERVICE,
} from '../../domain/tokens';
import type { AuthService } from '../../domain/services/auth.service';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { GoogleConfigService } from '../../domain/services/google-config.service';
import { randomUUID } from 'crypto';
import { User } from '../../domain/entities/user';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(GOOGLE_CONFIG_SERVICE)
    private readonly googleConfig: GoogleConfigService,
  ) {
    if (!googleConfig.isConfigured()) {
      // Se não há configuração, usar valores dummy para evitar erro
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL: 'http://localhost:3000/auth/google/callback',
        scope: ['email', 'profile'],
        passReqToCallback: false,
      });
      return;
    }

    super({
      clientID: googleConfig.getClientId(),
      clientSecret: googleConfig.getClientSecret(),
      callbackURL: googleConfig.getCallbackUrl(),
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || profile.name?.givenName || 'Usuário';

    if (!email) {
      throw new Error('Email não disponível pelo Google OAuth');
    }

    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Criar usuário mínimo (sem senha) na primeira autenticação via Google
      user = new User(
        randomUUID(),
        name,
        email,
        '',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        false,
        new Date(),
      );
      await this.userRepository.create(user);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'STUDENT',
    };
    const accessToken = this.authService.generateToken(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

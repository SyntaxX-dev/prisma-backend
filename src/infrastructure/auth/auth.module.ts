import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfiguration } from '../config/jwt.config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthService } from '../services/jwt.service';
import { AUTH_SERVICE, GOOGLE_CONFIG_SERVICE } from '../../domain/tokens';
import { GoogleStrategy } from './google.strategy';
import { InfrastructureModule } from '../config/infrastructure.module';
import { GoogleConfigServiceImpl } from '../services/google-config.service';
import { AuthService } from '../services/auth.service';

@Module({
  imports: [
    InfrastructureModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const config = JwtConfiguration.loadFromEnv();
        return {
          secret: config.secret,
          signOptions: { expiresIn: config.expiresIn },
        };
      },
    }),
  ],
  providers: [
    {
      provide: AUTH_SERVICE,
      useClass: JwtAuthService,
    },
    {
      provide: GOOGLE_CONFIG_SERVICE,
      useClass: GoogleConfigServiceImpl,
    },
    AuthService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [
    AUTH_SERVICE,
    GOOGLE_CONFIG_SERVICE,
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    JwtModule,
  ],
})
export class AuthModule {}

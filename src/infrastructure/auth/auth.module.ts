import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfiguration } from '../config/jwt.config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthService } from '../services/jwt.service';
import { AUTH_SERVICE } from '../../domain/tokens';
import { GoogleStrategy } from './google.strategy';
import { InfrastructureModule } from '../config/infrastructure.module';

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
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [AUTH_SERVICE, JwtStrategy, JwtModule],
})
export class AuthModule {} 
 
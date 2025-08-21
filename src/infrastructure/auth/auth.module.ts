import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfiguration } from '../config/jwt.config';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthService } from '../services/jwt.service';
import { AUTH_SERVICE } from '../../domain/tokens';

@Module({
  imports: [
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
  ],
  exports: [AUTH_SERVICE, JwtStrategy, JwtModule],
})
export class AuthModule {} 

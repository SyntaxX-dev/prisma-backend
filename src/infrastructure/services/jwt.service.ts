import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtConfiguration } from '../config/jwt.config';
import { AuthService, JwtPayload } from '../../domain/services/auth.service';

@Injectable()
export class JwtAuthService implements AuthService {
  constructor(private readonly jwtService: NestJwtService) {}

  generateToken(payload: JwtPayload): string {
    const config = JwtConfiguration.loadFromEnv();

    return this.jwtService.sign(payload, {
      secret: config.secret,
      expiresIn: config.expiresIn,
    });
  }

  verifyToken(token: string): JwtPayload {
    const config = JwtConfiguration.loadFromEnv();

    try {
      return this.jwtService.verify(token, {
        secret: config.secret,
      });
    } catch {
      throw new Error('Token inválido ou expirado');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = this.jwtService.decode(token);
      return decoded as JwtPayload | null;
    } catch {
      return null;
    }
  }
}

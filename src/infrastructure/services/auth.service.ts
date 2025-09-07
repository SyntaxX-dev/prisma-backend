import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../domain/enums/user-role';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload as JwtPayload;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }

  async isAdmin(payload: JwtPayload): Promise<boolean> {
    return payload.role === UserRole.ADMIN;
  }

  async isStudent(payload: JwtPayload): Promise<boolean> {
    return payload.role === UserRole.STUDENT;
  }
}

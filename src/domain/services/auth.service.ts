export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
}

export interface AuthService {
  generateToken(payload: JwtPayload): string;
  verifyToken(token: string): JwtPayload;
  decodeToken(token: string): JwtPayload | null;
  isAdmin(payload: JwtPayload): boolean;
}

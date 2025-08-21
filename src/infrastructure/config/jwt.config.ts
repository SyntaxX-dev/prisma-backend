export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export class JwtConfiguration {
  static loadFromEnv(): JwtConfig {
    const secret = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return {
      secret,
      expiresIn,
    };
  }
} 

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export class JwtConfiguration {
  static loadFromEnv(): JwtConfig {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error(
        'JWT_SECRET não configurado. Configure a variável de ambiente JWT_SECRET em produção. ' +
        'Nunca use valores padrão ou hardcoded para chaves criptográficas!'
      );
    }

    if (secret.length < 32) {
      throw new Error(
        'JWT_SECRET deve ter pelo menos 32 caracteres para segurança adequada. ' +
        'Use: openssl rand -base64 32 para gerar uma chave segura.'
      );
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return {
      secret,
      expiresIn,
    };
  }
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  successRedirectUrl: string;
}

export class GoogleConfiguration {
  static loadFromEnv(): GoogleConfig | null {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
    const successRedirectUrl = process.env.GOOGLE_SUCCESS_REDIRECT;

    if (!clientId || !clientSecret) {
      console.log('[Google OAuth] Credenciais não configuradas - Google OAuth desabilitado');
      return null;
    }

    return {
      clientId,
      clientSecret,
      callbackUrl: callbackUrl || 'http://localhost:3000/auth/google/callback',
      successRedirectUrl: successRedirectUrl || 'http://localhost:3000/oauth/success',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { GoogleConfigService } from '../../domain/services/google-config.service';
import { GoogleConfiguration } from '../config/google.config';

@Injectable()
export class GoogleConfigServiceImpl implements GoogleConfigService {
  private config = GoogleConfiguration.loadFromEnv();

  getClientId(): string {
    return this.config?.clientId || '';
  }

  getClientSecret(): string {
    return this.config?.clientSecret || '';
  }

  getCallbackUrl(): string {
    return (
      this.config?.callbackUrl || 'http://localhost:3000/auth/google/callback'
    );
  }

  getSuccessRedirectUrl(): string {
    return (
      this.config?.successRedirectUrl || 'http://localhost:3000/oauth/success'
    );
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}

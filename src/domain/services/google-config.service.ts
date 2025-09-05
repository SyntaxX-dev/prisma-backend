export interface GoogleConfigService {
  getClientId(): string;
  getClientSecret(): string;
  getCallbackUrl(): string;
  getSuccessRedirectUrl(): string;
  isConfigured(): boolean;
}

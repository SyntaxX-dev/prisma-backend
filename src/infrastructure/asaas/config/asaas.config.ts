import { registerAs } from '@nestjs/config';

export interface AsaasConfig {
  apiKey: string;
  baseUrl: string;
  webhookToken: string;
  environment: 'sandbox' | 'production';
}

export default registerAs(
  'asaas',
  (): AsaasConfig => ({
    apiKey: process.env.ASAAS_API_KEY || '',
    baseUrl:
      process.env.ASAAS_ENVIRONMENT === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://api-sandbox.asaas.com/v3',
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN || '',
    environment:
      (process.env.ASAAS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  }),
);


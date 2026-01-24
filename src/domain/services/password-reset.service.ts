export interface PasswordResetService {
  generateResetCode(email: string): Promise<string>;
  resendResetCode(email: string): Promise<string>;
  verifyResetCode(email: string, code: string): Promise<boolean>;
  resetPassword(email: string, newPassword: string): Promise<void>;
}

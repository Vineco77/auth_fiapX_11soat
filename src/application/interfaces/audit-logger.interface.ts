export type AuditAction =
  | 'REGISTER'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'VALIDATE_TOKEN_SUCCESS'
  | 'VALIDATE_TOKEN_FAILED';

export interface IAuditLogger {
  log(action: AuditAction, email: string, clientId?: string): Promise<void>;
}

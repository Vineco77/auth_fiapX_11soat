/**
 * Interface para o payload do JWT
 * 
 * Campos obrigatórios para compatibilidade com API Service:
 * - clientId: Identificador do usuário (renomeado de userId)
 * - email: Email do usuário (usado pela API para organizar S3)
 * - authenticated: Sempre true para tokens válidos
 * - exp: Timestamp de expiração (gerado automaticamente pelo jwt.sign)
 * - iat: Timestamp de criação (gerado automaticamente pelo jwt.sign)
 */
export interface JwtPayload {
  clientId: string;
  email: string;
  authenticated: boolean;
  exp?: number;  // Gerado automaticamente
  iat?: number;  // Gerado automaticamente
}

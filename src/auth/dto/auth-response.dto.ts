/**
 * Response DTO para operações de autenticação (register e login)
 * 
 * Retorna JWT e informações do usuário
 */
export class AuthResponseDto {
  clientId: string;
  email: string;
  accessToken: string;
  expiresIn: string;
  exp: number;
}

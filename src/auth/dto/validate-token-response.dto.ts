/**
 * Response DTO para validação de token
 */
export class ValidateTokenResponseDto {
  valid: boolean;
  user?: {
    email: string;
    clientId: string;
  };
  error?: string;
}

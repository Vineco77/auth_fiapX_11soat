export class ValidateTokenResponseDto {
  valid: boolean;
  user?: {
    email: string;
    clientId: string;
  };
  error?: string;
}

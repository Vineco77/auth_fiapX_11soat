import { IsJWT } from 'class-validator';

export class ValidateTokenDto {
  @IsJWT()
  token: string;
}
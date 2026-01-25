import { ConflictException } from '@nestjs/common';

export class ClientAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`Email ${email} já cadastrado`);
  }
}

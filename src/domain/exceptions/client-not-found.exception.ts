import { UnauthorizedException } from '@nestjs/common';

export class ClientNotFoundException extends UnauthorizedException {
  constructor() {
    super('Cliente não encontrado');
  }
}

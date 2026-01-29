import { NotFoundException } from '@nestjs/common';

export class ClientNotFoundException extends NotFoundException {
  constructor(message = 'Conta não encontrada. Faça o registro novamente.') {
    super(message);
  }
}

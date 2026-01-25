import { Injectable } from '@nestjs/common';
import { IHashService } from '@/application/interfaces/hash-service.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptHashService implements IHashService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

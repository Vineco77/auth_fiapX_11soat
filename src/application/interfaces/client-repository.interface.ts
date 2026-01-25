import { Client } from '@/domain/entities/client.entity';

export interface IClientRepository {
  findByEmail(email: string): Promise<Client | null>;
  findById(id: string): Promise<Client | null>;
  create(email: string, hashedPassword: string): Promise<Client>;
}

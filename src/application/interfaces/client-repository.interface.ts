import { Client } from '@/domain/entities/client.entity';

export interface IClientRepository {
  findByEmail(email: string, includeDeleted?: boolean): Promise<Client | null>;
  findById(id: string): Promise<Client | null>;
  create(email: string, hashedPassword: string): Promise<Client>;
  softDelete(id: string): Promise<void>;
  reactivate(id: string, newPasswordHash: string): Promise<Client>;
}

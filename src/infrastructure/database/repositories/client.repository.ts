import { Injectable } from '@nestjs/common';
import { IClientRepository } from '@/application/interfaces/client-repository.interface';
import { Client } from '@/domain/entities/client.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string, includeDeleted = false): Promise<Client | null> {
    const client = await this.prisma.client.findUnique({
      where: { email },
    });

    if (!client) {
      return null;
    }

    if (!includeDeleted && client.deletedAt) {
      return null;
    }

    return Client.fromPrisma(client);
  }

  async findById(id: string): Promise<Client | null> {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client || client.deletedAt) {
      return null;
    }

    return Client.fromPrisma(client);
  }

  async create(email: string, hashedPassword: string): Promise<Client> {
    const client = await this.prisma.client.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return Client.fromPrisma(client);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reactivate(id: string, newPasswordHash: string): Promise<Client> {
    const client = await this.prisma.client.update({
      where: { id },
      data: {
        deletedAt: null,
        password: newPasswordHash,
      },
    });

    return Client.fromPrisma(client);
  }
}

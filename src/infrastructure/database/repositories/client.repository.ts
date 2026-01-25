import { Injectable } from '@nestjs/common';
import { IClientRepository } from '@/application/interfaces/client-repository.interface';
import { Client } from '@/domain/entities/client.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<Client | null> {
    const client = await this.prisma.client.findUnique({
      where: { email },
    });

    return client ? Client.fromPrisma(client) : null;
  }

  async findById(id: string): Promise<Client | null> {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    return client ? Client.fromPrisma(client) : null;
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
}

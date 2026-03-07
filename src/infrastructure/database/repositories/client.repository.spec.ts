import { ClientRepository } from './client.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Client } from '@/domain/entities/client.entity';

const now = new Date('2026-01-01T00:00:00Z');

const makePrismaRecord = (overrides: Partial<{
  id: string;
  email: string;
  password: string;
  deletedAt: Date | null;
}> = {}) => ({
  id: 'uuid-123',
  email: 'test@example.com',
  password: 'hashed-password',
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const mockPrisma = () =>
  ({
    client: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>);

describe('ClientRepository', () => {
  let repository: ClientRepository;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    repository = new ClientRepository(prisma as any);
  });

  describe('findByEmail', () => {
    it('should return null when client does not exist', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await repository.findByEmail('notfound@test.com');
      expect(result).toBeNull();
    });

    it('should return null for a deleted client when includeDeleted is false (default)', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(
        makePrismaRecord({ deletedAt: new Date() }),
      );
      const result = await repository.findByEmail('test@example.com');
      expect(result).toBeNull();
    });

    it('should return deleted client when includeDeleted is true', async () => {
      const record = makePrismaRecord({ deletedAt: new Date() });
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(record);
      const result = await repository.findByEmail('test@example.com', true);
      expect(result).toBeInstanceOf(Client);
      expect(result!.isDeleted()).toBe(true);
    });

    it('should return active client', async () => {
      const record = makePrismaRecord();
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(record);
      const result = await repository.findByEmail('test@example.com');
      expect(result).toBeInstanceOf(Client);
      expect(result!.email).toBe(record.email);
    });
  });

  describe('findById', () => {
    it('should return null when client does not exist', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return null for a deleted client', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(
        makePrismaRecord({ deletedAt: new Date() }),
      );
      const result = await repository.findById('uuid-123');
      expect(result).toBeNull();
    });

    it('should return active client by id', async () => {
      const record = makePrismaRecord();
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(record);
      const result = await repository.findById('uuid-123');
      expect(result).toBeInstanceOf(Client);
      expect(result!.id).toBe(record.id);
    });
  });

  describe('create', () => {
    it('should create and return a Client entity', async () => {
      const record = makePrismaRecord();
      (prisma.client.create as jest.Mock).mockResolvedValue(record);

      const result = await repository.create('test@example.com', 'hashed-password');

      expect(result).toBeInstanceOf(Client);
      expect(result.email).toBe(record.email);
      expect(prisma.client.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', password: 'hashed-password' },
      });
    });
  });

  describe('softDelete', () => {
    it('should call prisma update with deletedAt set to a Date', async () => {
      (prisma.client.update as jest.Mock).mockResolvedValue({});

      await repository.softDelete('uuid-123');

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('reactivate', () => {
    it('should update deletedAt to null and update password', async () => {
      const record = makePrismaRecord({ deletedAt: null, password: 'new-hashed-password' });
      (prisma.client.update as jest.Mock).mockResolvedValue(record);

      const result = await repository.reactivate('uuid-123', 'new-hashed-password');

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { deletedAt: null, password: 'new-hashed-password' },
      });
      expect(result).toBeInstanceOf(Client);
    });
  });
});

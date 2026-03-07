import { Client } from './client.entity';

const makePrismaClient = (overrides: Partial<{
  id: string;
  email: string;
  password: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) => ({
  id: 'uuid-123',
  email: 'test@example.com',
  password: 'hashed-password',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('Client Entity', () => {
  describe('fromPrisma', () => {
    it('should map prisma object to Client entity correctly', () => {
      const prismaData = makePrismaClient();
      const client = Client.fromPrisma(prismaData);

      expect(client.id).toBe(prismaData.id);
      expect(client.email).toBe(prismaData.email);
      expect(client.password).toBe(prismaData.password);
      expect(client.deletedAt).toBeNull();
      expect(client.createdAt).toEqual(prismaData.createdAt);
      expect(client.updatedAt).toEqual(prismaData.updatedAt);
    });

    it('should map deletedAt when present', () => {
      const deletedAt = new Date('2026-02-01');
      const client = Client.fromPrisma(makePrismaClient({ deletedAt }));
      expect(client.deletedAt).toEqual(deletedAt);
    });
  });

  describe('isDeleted', () => {
    it('should return false when deletedAt is null', () => {
      const client = Client.fromPrisma(makePrismaClient({ deletedAt: null }));
      expect(client.isDeleted()).toBe(false);
    });

    it('should return true when deletedAt is a date', () => {
      const client = Client.fromPrisma(makePrismaClient({ deletedAt: new Date() }));
      expect(client.isDeleted()).toBe(true);
    });
  });
});

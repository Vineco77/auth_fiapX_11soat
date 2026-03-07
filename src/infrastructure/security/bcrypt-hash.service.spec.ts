import { BcryptHashService } from './bcrypt-hash.service';

describe('BcryptHashService', () => {
  let service: BcryptHashService;

  beforeEach(() => {
    service = new BcryptHashService();
  });

  describe('hash', () => {
    it('should return a hash different from the original password', async () => {
      const password = 'MyPassword@123';
      const hash = await service.hash(password);
      expect(hash).not.toBe(password);
    });

    it('should produce different hashes for the same password (due to salt)', async () => {
      const password = 'MyPassword@123';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);
      expect(hash1).not.toBe(hash2);
    });

    it('should produce a bcrypt hash (starts with $2b$10$)', async () => {
      const hash = await service.hash('SomePassword1');
      expect(hash).toMatch(/^\$2b\$10\$/);
    });
  });

  describe('compare', () => {
    it('should return true when password matches the hash', async () => {
      const password = 'MyPassword@123';
      const hash = await service.hash(password);
      const result = await service.compare(password, hash);
      expect(result).toBe(true);
    });

    it('should return false when password does not match the hash', async () => {
      const password = 'MyPassword@123';
      const hash = await service.hash(password);
      const result = await service.compare('WrongPassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for an empty string against a valid hash', async () => {
      const hash = await service.hash('MyPassword@123');
      const result = await service.compare('', hash);
      expect(result).toBe(false);
    });
  });
});

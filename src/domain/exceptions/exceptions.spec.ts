import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ClientAlreadyExistsException } from './client-already-exists.exception';
import { ClientNotFoundException } from './client-not-found.exception';
import { InvalidCredentialsException } from './invalid-credentials.exception';

describe('Domain Exceptions', () => {
  describe('ClientAlreadyExistsException', () => {
    it('should extend ConflictException', () => {
      const exception = new ClientAlreadyExistsException('test@example.com');
      expect(exception).toBeInstanceOf(ConflictException);
    });

    it('should contain the email in the message', () => {
      const email = 'test@example.com';
      const exception = new ClientAlreadyExistsException(email);
      expect(exception.message).toContain(email);
    });

    it('should have status 409', () => {
      const exception = new ClientAlreadyExistsException('user@test.com');
      expect(exception.getStatus()).toBe(409);
    });
  });

  describe('ClientNotFoundException', () => {
    it('should extend NotFoundException', () => {
      const exception = new ClientNotFoundException();
      expect(exception).toBeInstanceOf(NotFoundException);
    });

    it('should use default message when none is provided', () => {
      const exception = new ClientNotFoundException();
      expect(exception.message).toBeDefined();
      expect(exception.message.length).toBeGreaterThan(0);
    });

    it('should use custom message when provided', () => {
      const customMessage = 'Usuário não encontrado';
      const exception = new ClientNotFoundException(customMessage);
      expect(exception.message).toBe(customMessage);
    });

    it('should have status 404', () => {
      const exception = new ClientNotFoundException();
      expect(exception.getStatus()).toBe(404);
    });
  });

  describe('InvalidCredentialsException', () => {
    it('should extend UnauthorizedException', () => {
      const exception = new InvalidCredentialsException();
      expect(exception).toBeInstanceOf(UnauthorizedException);
    });

    it('should have message "Credenciais inválidas"', () => {
      const exception = new InvalidCredentialsException();
      expect(exception.message).toBe('Credenciais inválidas');
    });

    it('should have status 401', () => {
      const exception = new InvalidCredentialsException();
      expect(exception.getStatus()).toBe(401);
    });
  });
});

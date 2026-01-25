export interface JwtPayload {
  clientId: string;
  email: string;
  authenticated: boolean;
  exp?: number;
  iat?: number;
}

export interface TokenResponse {
  token: string;
  expiresIn: string;
  exp: number;
}

export interface ITokenService {
  generateToken(payload: Omit<JwtPayload, 'exp' | 'iat'>): Promise<TokenResponse>;
  verifyToken(token: string): Promise<JwtPayload>;
  decodeToken(token: string): JwtPayload | null;
}

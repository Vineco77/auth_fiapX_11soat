export class Client {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    email: string,
    password: string,
    deletedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.deletedAt = deletedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromPrisma(prismaClient: any): Client {
    return new Client(
      prismaClient.id,
      prismaClient.email,
      prismaClient.password,
      prismaClient.deletedAt,
      prismaClient.createdAt,
      prismaClient.updatedAt,
    );
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}

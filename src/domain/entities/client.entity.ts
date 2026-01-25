export class Client {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    email: string,
    password: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromPrisma(prismaClient: any): Client {
    return new Client(
      prismaClient.id,
      prismaClient.email,
      prismaClient.password,
      prismaClient.createdAt,
      prismaClient.updatedAt,
    );
  }
}

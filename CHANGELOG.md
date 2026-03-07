# 1.0.0 (2026-03-07)


### Bug Fixes

* correct repository name formatting in README ([bbe7d27](https://github.com/Vineco77/auth_fiapX_11soat/commit/bbe7d2761547bd10fb2b3d5231e04cb64c79d80f))


### Features

* add Dockerfile and docker-compose configuration for development environment ([d65a7e6](https://github.com/Vineco77/auth_fiapX_11soat/commit/d65a7e660372bd6465c781a8dff831032f83d46c))
* add DTOs for login, registration, and token validation; implement JWT strategy and middleware for logging and exception handling ([bd7b897](https://github.com/Vineco77/auth_fiapX_11soat/commit/bd7b897210c67764316550c3917b689ac347132a))
* add environment configuration for database and JWT; implement response DTOs and JWT payload interface; update AuthService and JwtStrategy for improved token handling ([0552de0](https://github.com/Vineco77/auth_fiapX_11soat/commit/0552de0685ad156b5a8fdb80d1d104adda69f318))
* add initial Prisma configuration and database schema for User and AuthLog models ([c0545e5](https://github.com/Vineco77/auth_fiapX_11soat/commit/c0545e597f9ac9a01ddf60edb9f117e9cb7b9d5d))
* add linting script and Jest configuration to package.json ([076012c](https://github.com/Vineco77/auth_fiapX_11soat/commit/076012c500051bb2177469610e694985de347ad5))
* **ci:** add DATABASE_URL environment variable for Prisma client generation ([3e11f30](https://github.com/Vineco77/auth_fiapX_11soat/commit/3e11f30db67e99f8f00f44605ae8cdb8e613472a))
* implement authentication module with registration, login, and token validation ([0aa19f2](https://github.com/Vineco77/auth_fiapX_11soat/commit/0aa19f2b3f82701ff6a31c715fb1b8e45bcc81cf))
* implement health check module with controller and service; update Dockerfile and docker-compose for production setup; modify .env.example for JWT_SECRET ([8808621](https://github.com/Vineco77/auth_fiapX_11soat/commit/880862137cbbdb49d8d795c0e68ab8da6c4b18b3))
* implement soft delete and reactivation for clients; update client repository and service; add user deletion and reactivation actions ([32f534e](https://github.com/Vineco77/auth_fiapX_11soat/commit/32f534e7a865e456def6f07c37621481e310cee6))
* initialize project with NestJS and Prisma setup ([705d1db](https://github.com/Vineco77/auth_fiapX_11soat/commit/705d1dbbe99f6b0d4e003979ccf64259141a0438))
* **logging:** integrate Pino for structured logging and Elasticsearch support ([08a9f21](https://github.com/Vineco77/auth_fiapX_11soat/commit/08a9f2194fb5074ac00baaf9227bb9ec4bc38af0))
* rename User model to Client and update related database schema ([9f7198e](https://github.com/Vineco77/auth_fiapX_11soat/commit/9f7198e7e298383df2747ffcbf130be642dfa166))

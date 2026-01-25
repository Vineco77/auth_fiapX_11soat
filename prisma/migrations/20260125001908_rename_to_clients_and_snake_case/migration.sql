-- RenameTable
ALTER TABLE "User" RENAME TO "clients";
ALTER TABLE "AuthLog" RENAME TO "auth_logs";

-- RenameColumn in clients
ALTER TABLE "clients" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "clients" RENAME COLUMN "updatedAt" TO "updated_at";

-- RenameColumn in auth_logs
ALTER TABLE "auth_logs" RENAME COLUMN "userId" TO "client_id";

-- RenameConstraint (Foreign Key)
ALTER TABLE "auth_logs" DROP CONSTRAINT "AuthLog_userId_fkey";
ALTER TABLE "auth_logs" ADD CONSTRAINT "auth_logs_client_id_fkey" 
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

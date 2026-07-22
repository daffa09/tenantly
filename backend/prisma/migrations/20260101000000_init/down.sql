-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Task";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "TaskStatus";


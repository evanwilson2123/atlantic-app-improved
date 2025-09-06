-- CreateTable
CREATE TABLE "public"."PrismaInit" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrismaInit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Athlete" (
    "id" SERIAL NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "activeStatus" BOOLEAN NOT NULL DEFAULT true,
    "playLevel" TEXT NOT NULL,
    "syncId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "routes" (
    "id" SERIAL NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "gpx_storage_key" VARCHAR(500),
    "gpx_size_bytes" BIGINT,
    "gpx_sha256" CHAR(64),
    "time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" VARCHAR(255),
    "description" TEXT,
    "user_id" UUID
);

-- CreateTable
CREATE TABLE "admins" (
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idx_24579_id" ON "routes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_24579_identifier" ON "routes"("identifier");

-- CreateIndex
CREATE INDEX "routes_user_id_idx" ON "routes"("user_id");


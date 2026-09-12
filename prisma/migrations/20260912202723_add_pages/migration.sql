-- CreateTable
CREATE TABLE "pages" (
    "id" SERIAL NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_routes" (
    "page_id" INTEGER NOT NULL,
    "route_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_routes_pkey" PRIMARY KEY ("page_id","route_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pages_identifier_key" ON "pages"("identifier");

-- CreateIndex
CREATE INDEX "pages_user_id_idx" ON "pages"("user_id");

-- CreateIndex
CREATE INDEX "page_routes_route_id_idx" ON "page_routes"("route_id");

-- AddForeignKey
ALTER TABLE "page_routes" ADD CONSTRAINT "page_routes_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_routes" ADD CONSTRAINT "page_routes_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

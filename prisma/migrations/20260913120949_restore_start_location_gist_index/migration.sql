-- CreateIndex
CREATE INDEX "routes_start_location_gix" ON "routes" USING GIST ("start_location");

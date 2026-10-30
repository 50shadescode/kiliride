BEGIN;
CREATE TYPE "VehicleImageObjectState" AS ENUM ('PENDING', 'ACTIVE', 'DELETE_PENDING');
CREATE TABLE "VehicleImageObject" (
  "key" TEXT PRIMARY KEY,
  "state" "VehicleImageObjectState" NOT NULL DEFAULT 'PENDING',
  "sha256" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleImageObject_values_check" CHECK (
    key ~ '^[a-f0-9-]{36}\.webp$' AND sha256 ~ '^[a-f0-9]{64}$' AND
    "byteSize" BETWEEN 1 AND 5242880 AND width BETWEEN 1 AND 2400 AND height BETWEEN 1 AND 2400
  )
);
CREATE INDEX "VehicleImageObject_state_createdAt_idx" ON "VehicleImageObject"(state,"createdAt");
ALTER TABLE "VehiclePhoto" ADD COLUMN "objectKey" TEXT;
CREATE UNIQUE INDEX "VehiclePhoto_objectKey_key" ON "VehiclePhoto"("objectKey");
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_objectKey_fkey" FOREIGN KEY ("objectKey") REFERENCES "VehicleImageObject"(key) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_object_check" CHECK ("objectKey" IS NULL OR ("objectKey" = "storageKey" AND "contentType" = 'image/webp'));

-- Old metadata-only rows stay intact. Actual image writes additionally lock the
-- parent so a concurrent review submission cannot race a photo mutation.
CREATE FUNCTION guard_vehicle_photo_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target TEXT; listing "VehicleListingStatus";
BEGIN
  IF TG_OP = 'DELETE' THEN target := OLD."vehicleId"; ELSE target := NEW."vehicleId"; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.id <> OLD.id OR NEW."vehicleId" <> OLD."vehicleId") THEN
    RAISE EXCEPTION 'Photo identity and vehicle cannot change';
  END IF;
  SELECT status INTO listing FROM "Vehicle" WHERE id = target FOR UPDATE;
  IF listing NOT IN ('DRAFT','REJECTED') THEN RAISE EXCEPTION 'Reviewed photographs are read-only'; END IF;
  IF TG_OP <> 'DELETE' AND NEW."objectKey" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "VehicleImageObject" WHERE key = NEW."objectKey" AND state = 'ACTIVE' AND "byteSize" = NEW."byteSize"
  ) THEN RAISE EXCEPTION 'Active normalized image required'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
CREATE TRIGGER vehicle_photo_guard BEFORE INSERT OR UPDATE OR DELETE ON "VehiclePhoto" FOR EACH ROW EXECUTE FUNCTION guard_vehicle_photo_mutation();
COMMIT;

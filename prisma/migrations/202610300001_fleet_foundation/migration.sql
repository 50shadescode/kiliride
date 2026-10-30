-- Additive Phase 2A foundation. No identity or existing migration changes.
BEGIN;
-- CreateEnum
CREATE TYPE "VehicleListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleReviewDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "publicId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "seats" INTEGER NOT NULL,
    "fuelType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "baseHalfDay" INTEGER NOT NULL,
    "baseFullDay" INTEGER NOT NULL,
    "status" "VehicleListingStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "approvedReviewId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleOwnership" (
    "vehicleId" TEXT NOT NULL,
    "ownerId" TEXT,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMPTZ(3),
    "reason" TEXT,
    "evidenceReference" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleOwnership_pkey" PRIMARY KEY ("vehicleId")
);

-- CreateTable
CREATE TABLE "VehicleRegistration" (
    "vehicleId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VehicleRegistration_pkey" PRIMARY KEY ("vehicleId")
);

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "vehicleId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "altText" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleReview" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "vehicleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "VehicleReviewDecision" NOT NULL,
    "vehicleRevision" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "criteriaVersion" TEXT,
    "evidenceReference" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleListingEvent" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "vehicleId" TEXT NOT NULL,
    "actorId" TEXT,
    "fromStatus" "VehicleListingStatus",
    "toStatus" "VehicleListingStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleListingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyVehicleImport" (
    "sourceId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "operator" TEXT NOT NULL,
    "importedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyVehicleImport_pkey" PRIMARY KEY ("sourceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_publicId_key" ON "Vehicle"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_approvedReviewId_key" ON "Vehicle"("approvedReviewId");

-- CreateIndex
CREATE INDEX "Vehicle_status_createdAt_idx" ON "Vehicle"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VehicleOwnership_ownerId_idx" ON "VehicleOwnership"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleRegistration_registrationNumber_key" ON "VehicleRegistration"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclePhoto_storageKey_key" ON "VehiclePhoto"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclePhoto_vehicleId_position_key" ON "VehiclePhoto"("vehicleId", "position");

-- CreateIndex
CREATE INDEX "VehicleReview_vehicleId_createdAt_idx" ON "VehicleReview"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "VehicleListingEvent_vehicleId_createdAt_idx" ON "VehicleListingEvent"("vehicleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyVehicleImport_vehicleId_key" ON "LegacyVehicleImport"("vehicleId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_approvedReviewId_fkey" FOREIGN KEY ("approvedReviewId") REFERENCES "VehicleReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleOwnership" ADD CONSTRAINT "VehicleOwnership_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleOwnership" ADD CONSTRAINT "VehicleOwnership_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleOwnership" ADD CONSTRAINT "VehicleOwnership_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRegistration" ADD CONSTRAINT "VehicleRegistration_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleReview" ADD CONSTRAINT "VehicleReview_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleReview" ADD CONSTRAINT "VehicleReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleListingEvent" ADD CONSTRAINT "VehicleListingEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleListingEvent" ADD CONSTRAINT "VehicleListingEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyVehicleImport" ADD CONSTRAINT "LegacyVehicleImport_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exact integer KES, stable slugs and truthful approval provenance.
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_values_check" CHECK (
  "publicId" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND "seats" > 0 AND
  "baseHalfDay" > 0 AND "baseFullDay" > 0 AND "currency" = 'KES' AND "revision" >= 0 AND
  length(btrim("make")) > 0 AND length(btrim("model")) > 0 AND length(btrim("location")) > 0 AND
  "fuelType" IN ('Petrol','Diesel','Hybrid','Electric') AND "transmission" IN ('Automatic','Manual') AND
  (("status" = 'APPROVED') = ("approvedReviewId" IS NOT NULL))
);
ALTER TABLE "VehicleOwnership" ADD CONSTRAINT "VehicleOwnership_assignment_check" CHECK (
  ("ownerId" IS NULL AND "assignedById" IS NULL AND "assignedAt" IS NULL AND "reason" IS NULL AND "evidenceReference" IS NULL) OR
  ("ownerId" IS NOT NULL AND "assignedById" IS NOT NULL AND "assignedAt" IS NOT NULL AND
   "reason" IS NOT NULL AND length(btrim("reason")) >= 10 AND "evidenceReference" IS NOT NULL AND length(btrim("evidenceReference")) >= 3)
);
ALTER TABLE "VehicleRegistration" ADD CONSTRAINT "VehicleRegistration_number_check" CHECK (
  length(btrim("registrationNumber")) > 0 AND "registrationNumber" = upper(btrim("registrationNumber"))
);
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_metadata_check" CHECK (
  "byteSize" > 0 AND "position" >= 0 AND length(btrim("storageKey")) > 0 AND length(btrim("altText")) > 0
);
CREATE UNIQUE INDEX "VehiclePhoto_one_cover" ON "VehiclePhoto" ("vehicleId") WHERE "isCover";
ALTER TABLE "VehicleReview" ADD CONSTRAINT "VehicleReview_evidence_check" CHECK (
  "vehicleRevision" >= 0 AND length(btrim("reason")) >= 10 AND
  ("decision" <> 'APPROVED' OR ("criteriaVersion" IS NOT NULL AND length(btrim("criteriaVersion")) >= 3 AND
   "evidenceReference" IS NOT NULL AND length(btrim("evidenceReference")) >= 3))
);
ALTER TABLE "VehicleListingEvent" ADD CONSTRAINT "VehicleListingEvent_actor_check" CHECK (
  length(btrim("reason")) >= 10 AND ("actorId" IS NOT NULL OR ("fromStatus" IS NULL AND "toStatus" = 'DRAFT'))
);

CREATE FUNCTION guard_vehicle_listing() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."status" <> 'DRAFT' OR NEW."revision" <> 0 THEN RAISE EXCEPTION 'Vehicle must start as DRAFT'; END IF;
    RETURN NEW;
  END IF;
  IF NEW."publicId" <> OLD."publicId" OR NEW."id" <> OLD."id" THEN RAISE EXCEPTION 'Vehicle identifiers are immutable'; END IF;
  IF NEW."revision" <> OLD."revision" + 1 THEN RAISE EXCEPTION 'Vehicle revision must increment'; END IF;
  IF OLD."status" IN ('PENDING_REVIEW','APPROVED') AND
     ROW(NEW."make",NEW."model",NEW."category",NEW."description",NEW."seats",NEW."fuelType",NEW."transmission",NEW."location",NEW."baseHalfDay",NEW."baseFullDay") IS DISTINCT FROM
     ROW(OLD."make",OLD."model",OLD."category",OLD."description",OLD."seats",OLD."fuelType",OLD."transmission",OLD."location",OLD."baseHalfDay",OLD."baseFullDay") THEN
    RAISE EXCEPTION 'Reviewed vehicle details cannot change';
  END IF;
  IF NEW."status" <> OLD."status" AND NOT (
    (OLD."status" = 'DRAFT' AND NEW."status" = 'PENDING_REVIEW') OR
    (OLD."status" = 'PENDING_REVIEW' AND NEW."status" IN ('APPROVED','REJECTED')) OR
    (OLD."status" = 'APPROVED' AND NEW."status" = 'SUSPENDED') OR
    (OLD."status" IN ('REJECTED','SUSPENDED') AND NEW."status" = 'DRAFT')
  ) THEN RAISE EXCEPTION 'Invalid listing transition'; END IF;
  IF NEW."status" IN ('PENDING_REVIEW','APPROVED') AND NOT EXISTS (
    SELECT 1 FROM "VehicleOwnership" o JOIN "User" u ON u.id = o."ownerId"
    JOIN "RoleAssignment" r ON r."userId" = u.id AND r.role = 'HOST'
    WHERE o."vehicleId" = NEW.id AND u."emailVerified"
  ) THEN RAISE EXCEPTION 'Assigned verified HOST required'; END IF;
  IF NEW."status" = 'APPROVED' AND NOT EXISTS (
    SELECT 1 FROM "VehicleReview" r WHERE r.id = NEW."approvedReviewId" AND r."vehicleId" = NEW.id
    AND r.decision = 'APPROVED' AND r."vehicleRevision" = OLD."revision"
  ) THEN RAISE EXCEPTION 'Current vehicle approval evidence required'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicle_listing_guard BEFORE INSERT OR UPDATE ON "Vehicle" FOR EACH ROW EXECUTE FUNCTION guard_vehicle_listing();

CREATE FUNCTION guard_vehicle_ownership() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD."ownerId" IS NOT NULL OR NEW."vehicleId" <> OLD."vehicleId") THEN
    RAISE EXCEPTION 'Ownership reassignment is not supported';
  END IF;
  IF NEW."ownerId" IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM "Vehicle" WHERE id = NEW."vehicleId" AND status = 'DRAFT') OR
       NOT EXISTS (SELECT 1 FROM "User" u JOIN "RoleAssignment" r ON r."userId" = u.id WHERE u.id = NEW."ownerId" AND u."emailVerified" AND r.role = 'HOST') OR
       NOT EXISTS (SELECT 1 FROM "User" u JOIN "RoleAssignment" r ON r."userId" = u.id WHERE u.id = NEW."assignedById" AND u."emailVerified" AND u."twoFactorEnabled" AND r.role = 'ADMIN') THEN
      RAISE EXCEPTION 'Authorized assignment to a verified HOST required';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicle_ownership_guard BEFORE INSERT OR UPDATE ON "VehicleOwnership" FOR EACH ROW EXECUTE FUNCTION guard_vehicle_ownership();
CREATE TRIGGER vehicle_ownership_no_delete BEFORE DELETE ON "VehicleOwnership" FOR EACH ROW EXECUTE FUNCTION preserve_audit_history();

CREATE FUNCTION guard_vehicle_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "User" u JOIN "RoleAssignment" r ON r."userId" = u.id WHERE u.id = NEW."reviewerId" AND u."emailVerified" AND u."twoFactorEnabled" AND r.role = 'ADMIN') OR
     NOT EXISTS (SELECT 1 FROM "Vehicle" v JOIN "VehicleOwnership" o ON o."vehicleId" = v.id
       WHERE v.id = NEW."vehicleId" AND v.status = 'PENDING_REVIEW' AND v.revision = NEW."vehicleRevision" AND o."ownerId" IS NOT NULL AND o."ownerId" <> NEW."reviewerId") THEN
    RAISE EXCEPTION 'Independent authorized review of current submission required';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicle_review_guard BEFORE INSERT ON "VehicleReview" FOR EACH ROW EXECUTE FUNCTION guard_vehicle_review();
CREATE TRIGGER vehicle_review_immutable BEFORE UPDATE OR DELETE ON "VehicleReview" FOR EACH ROW EXECUTE FUNCTION preserve_audit_history();
CREATE TRIGGER vehicle_event_immutable BEFORE UPDATE OR DELETE ON "VehicleListingEvent" FOR EACH ROW EXECUTE FUNCTION preserve_audit_history();
CREATE TRIGGER legacy_import_immutable BEFORE UPDATE OR DELETE ON "LegacyVehicleImport" FOR EACH ROW EXECUTE FUNCTION preserve_audit_history();
COMMIT;

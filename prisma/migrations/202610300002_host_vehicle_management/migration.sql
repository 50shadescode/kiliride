BEGIN;
CREATE TYPE "VehicleOwnershipOrigin" AS ENUM ('UNASSIGNED', 'ADMIN_ASSIGNED', 'HOST_DECLARED');
-- Existing assignments were administrator-recorded. Preserve their provenance.
ALTER TABLE "VehicleOwnership" ADD COLUMN "origin" "VehicleOwnershipOrigin" NOT NULL DEFAULT 'ADMIN_ASSIGNED',
  ADD COLUMN "declaredAt" TIMESTAMPTZ(3);
UPDATE "VehicleOwnership" SET "origin" = 'UNASSIGNED' WHERE "ownerId" IS NULL;
ALTER TABLE "VehicleOwnership" ALTER COLUMN "origin" SET DEFAULT 'UNASSIGNED';
ALTER TABLE "VehicleOwnership" DROP CONSTRAINT "VehicleOwnership_assignment_check";
ALTER TABLE "VehicleOwnership" ADD CONSTRAINT "VehicleOwnership_assignment_check" CHECK (
  ("origin" = 'UNASSIGNED' AND "ownerId" IS NULL AND "declaredAt" IS NULL AND "assignedById" IS NULL AND "assignedAt" IS NULL AND "reason" IS NULL AND "evidenceReference" IS NULL) OR
  ("origin" = 'HOST_DECLARED' AND "ownerId" IS NOT NULL AND "declaredAt" IS NOT NULL AND "assignedById" IS NULL AND "assignedAt" IS NULL AND "reason" IS NULL AND "evidenceReference" IS NULL) OR
  ("origin" = 'ADMIN_ASSIGNED' AND "ownerId" IS NOT NULL AND "declaredAt" IS NULL AND "assignedById" IS NOT NULL AND "assignedAt" IS NOT NULL AND
   "reason" IS NOT NULL AND length(btrim("reason")) >= 10 AND "evidenceReference" IS NOT NULL AND length(btrim("evidenceReference")) >= 3)
);

CREATE OR REPLACE FUNCTION guard_vehicle_ownership() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD."ownerId" IS NOT NULL OR NEW."vehicleId" <> OLD."vehicleId") THEN
    RAISE EXCEPTION 'Ownership reassignment is not supported';
  END IF;
  IF NEW."ownerId" IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM "Vehicle" WHERE id = NEW."vehicleId" AND status = 'DRAFT') OR
       NOT EXISTS (SELECT 1 FROM "User" u JOIN "RoleAssignment" r ON r."userId" = u.id WHERE u.id = NEW."ownerId" AND u."emailVerified" AND r.role = 'HOST') THEN
      RAISE EXCEPTION 'Verified HOST required for a draft';
    END IF;
    IF NEW."origin" = 'HOST_DECLARED' THEN
      IF TG_OP <> 'INSERT' OR EXISTS (SELECT 1 FROM "LegacyVehicleImport" WHERE "vehicleId" = NEW."vehicleId") THEN
        RAISE EXCEPTION 'Host declaration is only allowed for a new listing';
      END IF;
    ELSIF NEW."origin" <> 'ADMIN_ASSIGNED' OR NOT EXISTS (
      SELECT 1 FROM "User" u JOIN "RoleAssignment" r ON r."userId" = u.id
      WHERE u.id = NEW."assignedById" AND u."emailVerified" AND u."twoFactorEnabled" AND r.role = 'ADMIN'
    ) THEN RAISE EXCEPTION 'Authorized administrator assignment required'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Completeness concerns listing text/specifications only, not future photo/KYC policy.
CREATE FUNCTION guard_complete_vehicle_submission() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'PENDING_REVIEW' AND OLD.status <> 'PENDING_REVIEW' THEN
    IF NEW.description IS NULL OR length(btrim(NEW.description)) = 0 OR length(btrim(NEW.category)) = 0 OR
       NOT EXISTS (SELECT 1 FROM "VehicleRegistration" WHERE "vehicleId" = NEW.id AND length(btrim("registrationNumber")) > 0) THEN
      RAISE EXCEPTION 'Complete description, category and registration required for review';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicle_submission_guard BEFORE UPDATE ON "Vehicle" FOR EACH ROW EXECUTE FUNCTION guard_complete_vehicle_submission();
COMMIT;

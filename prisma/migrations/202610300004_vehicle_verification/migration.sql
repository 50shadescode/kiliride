BEGIN;
CREATE TABLE "VehicleVerificationPolicy" (
  version TEXT PRIMARY KEY, reference TEXT NOT NULL, "approvedById" TEXT NOT NULL,
  "approvedAt" TIMESTAMPTZ(3) NOT NULL, enabled BOOLEAN NOT NULL DEFAULT false, "testOnly" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "VehicleVerificationPolicy_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VehicleVerificationPolicy_values_check" CHECK (length(btrim(version)) BETWEEN 3 AND 500 AND length(btrim(reference)) BETWEEN 3 AND 500)
);
CREATE TABLE "VehicleDecisionRecord" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "vehicleId" TEXT NOT NULL, "reviewerId" TEXT NOT NULL, "reviewId" TEXT,
  "fromStatus" "VehicleListingStatus" NOT NULL, "toStatus" "VehicleListingStatus" NOT NULL,
  "vehicleRevision" INTEGER NOT NULL, reason TEXT NOT NULL, "evidenceReference" TEXT,
  "policyVersion" TEXT, checklist JSONB, "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleDecisionRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VehicleDecisionRecord_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VehicleDecisionRecord_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "VehicleReview"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VehicleDecisionRecord_policyVersion_fkey" FOREIGN KEY ("policyVersion") REFERENCES "VehicleVerificationPolicy"(version) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VehicleDecisionRecord_values_check" CHECK ("vehicleRevision" >= 0 AND length(btrim(reason)) BETWEEN 10 AND 1000)
);
CREATE UNIQUE INDEX "VehicleDecisionRecord_reviewId_key" ON "VehicleDecisionRecord"("reviewId");
CREATE UNIQUE INDEX "VehicleDecisionRecord_vehicleId_vehicleRevision_key" ON "VehicleDecisionRecord"("vehicleId","vehicleRevision");
CREATE INDEX "VehicleDecisionRecord_vehicleId_createdAt_idx" ON "VehicleDecisionRecord"("vehicleId","createdAt");

CREATE FUNCTION guard_verification_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."testOnly" AND current_database() <> 'kiliride_test' THEN RAISE EXCEPTION 'Test policy requires isolated test database'; END IF;
  IF NEW."approvedAt" > CURRENT_TIMESTAMP OR NOT EXISTS (
    SELECT 1 FROM "User" u JOIN "RoleAssignment" r ON r."userId" = u.id
    WHERE u.id = NEW."approvedById" AND u."emailVerified" AND u."twoFactorEnabled" AND r.role = 'ADMIN'
  ) THEN RAISE EXCEPTION 'Policy authorization record required'; END IF;
  IF TG_OP = 'UPDATE' AND ROW(NEW.version,NEW.reference,NEW."approvedById",NEW."approvedAt",NEW."testOnly") IS DISTINCT FROM ROW(OLD.version,OLD.reference,OLD."approvedById",OLD."approvedAt",OLD."testOnly") THEN
    RAISE EXCEPTION 'Policy content is immutable; record a new version';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER verification_policy_guard BEFORE INSERT OR UPDATE ON "VehicleVerificationPolicy" FOR EACH ROW EXECUTE FUNCTION guard_verification_policy();
CREATE TRIGGER verification_policy_no_delete BEFORE DELETE ON "VehicleVerificationPolicy" FOR EACH ROW EXECUTE FUNCTION preserve_audit_history();

CREATE FUNCTION guard_vehicle_decision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v "Vehicle"; check_name TEXT;
BEGIN
  SELECT * INTO v FROM "Vehicle" WHERE id = NEW."vehicleId" FOR UPDATE;
  IF v.id IS NULL OR v.status <> NEW."fromStatus" OR v.revision <> NEW."vehicleRevision" THEN RAISE EXCEPTION 'Stale decision'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "User" u JOIN "RoleAssignment" r ON r."userId" = u.id WHERE u.id = NEW."reviewerId" AND u."emailVerified" AND u."twoFactorEnabled" AND r.role = 'ADMIN') OR
     EXISTS (SELECT 1 FROM "VehicleOwnership" WHERE "vehicleId" = v.id AND "ownerId" = NEW."reviewerId") THEN RAISE EXCEPTION 'Independent MFA administrator required'; END IF;
  IF NOT ((v.status = 'PENDING_REVIEW' AND NEW."toStatus" IN ('APPROVED','REJECTED')) OR (v.status = 'APPROVED' AND NEW."toStatus" = 'SUSPENDED') OR (v.status IN ('SUSPENDED','REJECTED') AND NEW."toStatus" = 'DRAFT')) THEN RAISE EXCEPTION 'Invalid administrator decision'; END IF;
  IF NEW."toStatus" IN ('APPROVED','REJECTED') AND NOT EXISTS (
    SELECT 1 FROM "VehicleReview" WHERE id = NEW."reviewId" AND "vehicleId" = v.id AND "reviewerId" = NEW."reviewerId" AND "vehicleRevision" = v.revision AND decision::text = NEW."toStatus"::text
  ) THEN RAISE EXCEPTION 'Matching immutable review required'; END IF;
  IF NEW."toStatus" = 'APPROVED' THEN
    PERFORM 1 FROM "VehicleVerificationPolicy" WHERE version = NEW."policyVersion" AND enabled AND (NOT "testOnly" OR current_database() = 'kiliride_test') FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Enabled verification policy required'; END IF;
    IF NEW.checklist IS NULL OR jsonb_typeof(NEW.checklist) <> 'object' THEN RAISE EXCEPTION 'Verification checklist required'; END IF;
    FOREACH check_name IN ARRAY ARRAY['vehicleIdentity','ownershipAuthority','registrationEvidence','listingAccuracy','rentalDocumentation'] LOOP
      IF (NEW.checklist->check_name->>'confirmed') IS DISTINCT FROM 'true' OR COALESCE(length(btrim(NEW.checklist->check_name->>'evidenceReference')),0) < 3 THEN RAISE EXCEPTION 'Incomplete verification evidence'; END IF;
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM "VehiclePhoto" p JOIN "VehicleImageObject" o ON o.key = p."objectKey" WHERE p."vehicleId" = v.id AND o.state = 'ACTIVE') THEN RAISE EXCEPTION 'Stored vehicle photographs required'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicle_decision_guard BEFORE INSERT ON "VehicleDecisionRecord" FOR EACH ROW EXECUTE FUNCTION guard_vehicle_decision();
CREATE TRIGGER vehicle_decision_immutable BEFORE UPDATE OR DELETE ON "VehicleDecisionRecord" FOR EACH ROW EXECUTE FUNCTION preserve_audit_history();

-- Historical approvals are retained without fabricating checklist evidence.
-- Every new approval must reference a current, structured decision record.
CREATE FUNCTION guard_vehicle_approval_decision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status <> 'APPROVED' AND NOT EXISTS (
    SELECT 1 FROM "VehicleDecisionRecord" d WHERE d."vehicleId" = NEW.id AND d."vehicleRevision" = OLD.revision AND d."reviewId" = NEW."approvedReviewId" AND d."toStatus" = 'APPROVED'
  ) THEN RAISE EXCEPTION 'Current verification decision required'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicle_approval_decision_guard BEFORE UPDATE ON "Vehicle" FOR EACH ROW EXECUTE FUNCTION guard_vehicle_approval_decision();
COMMIT;

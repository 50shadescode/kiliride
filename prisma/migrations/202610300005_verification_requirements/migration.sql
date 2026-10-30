BEGIN;
-- Existing records remain untouched. Missing matrix configuration blocks future
-- approvals; it is never interpreted as no applicable requirements.
ALTER TABLE "VehicleVerificationPolicy" ADD COLUMN requirements JSONB;
CREATE FUNCTION guard_policy_requirements() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.requirements IS DISTINCT FROM OLD.requirements THEN RAISE EXCEPTION 'Policy requirements are immutable; record a new version'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER verification_requirements_immutable BEFORE UPDATE ON "VehicleVerificationPolicy" FOR EACH ROW EXECUTE FUNCTION guard_policy_requirements();

CREATE FUNCTION guard_vehicle_compliance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE matrix JSONB; profile JSONB; requirement JSONB; assessment JSONB;
BEGIN
  IF NEW."toStatus" <> 'APPROVED' THEN RETURN NEW; END IF;
  SELECT requirements INTO matrix FROM "VehicleVerificationPolicy" WHERE version = NEW."policyVersion" FOR SHARE;
  assessment := NEW.checklist->'compliance';
  IF matrix IS NULL OR jsonb_typeof(matrix->'profiles') IS DISTINCT FROM 'array' OR (assessment->>'contextConfirmed') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Approved compliance requirements and context assessment required'; END IF;
  SELECT p INTO profile FROM jsonb_array_elements(matrix->'profiles') p WHERE p->>'id' = assessment->>'profileId';
  IF profile IS NULL OR jsonb_typeof(profile->'requirements') IS DISTINCT FROM 'array' OR jsonb_array_length(profile->'requirements') = 0 OR profile->'context'->>'rentalArrangement' NOT IN ('SELF_DRIVE','CHAUFFEUR_DRIVEN') OR profile->'context'->>'rentalArrangement' IS NULL THEN RAISE EXCEPTION 'Resolved compliance profile required'; END IF;
  IF assessment->'requirementsSnapshot' IS DISTINCT FROM profile THEN RAISE EXCEPTION 'Matching immutable requirements snapshot required'; END IF;
  FOR requirement IN SELECT * FROM jsonb_array_elements(profile->'requirements') LOOP
    IF (requirement->>'reviewStatus') IS DISTINCT FROM 'CONFIRMED' OR COALESCE(requirement->>'applicability','') NOT IN ('MANDATORY','NOT_APPLICABLE') OR COALESCE(length(btrim(requirement->>'supportingAuthority')),0) < 3 OR COALESCE(length(btrim(requirement->>'applicabilityBasis')),0) < 3 OR COALESCE(length(btrim(requirement->>'evidenceType')),0) < 3 THEN RAISE EXCEPTION 'Unresolved compliance requirement'; END IF;
    IF requirement->>'applicability' = 'MANDATORY' AND ((assessment->'checks'->(requirement->>'id')->>'confirmed') IS DISTINCT FROM 'true' OR COALESCE(length(btrim(assessment->'checks'->(requirement->>'id')->>'evidenceReference')),0) < 3) THEN RAISE EXCEPTION 'Mandatory compliance evidence required'; END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicle_compliance_guard BEFORE INSERT ON "VehicleDecisionRecord" FOR EACH ROW EXECUTE FUNCTION guard_vehicle_compliance();
COMMIT;

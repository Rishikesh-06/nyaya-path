-- Create the audit trigger function
CREATE OR REPLACE FUNCTION audit_cases_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if description changed
    IF OLD.description IS DISTINCT FROM NEW.description THEN
        INSERT INTO case_audit_logs (case_id, field_name, old_value, new_value, changed_at)
        VALUES (NEW.id, 'description', OLD.description, NEW.description, NOW());
    END IF;

    -- Check if title changed
    IF OLD.title IS DISTINCT FROM NEW.title THEN
        INSERT INTO case_audit_logs (case_id, field_name, old_value, new_value, changed_at)
        VALUES (NEW.id, 'title', OLD.title, NEW.title, NOW());
    END IF;

    -- Check if victim_id changed
    IF OLD.victim_id IS DISTINCT FROM NEW.victim_id THEN
        INSERT INTO case_audit_logs (case_id, field_name, old_value, new_value, changed_at)
        VALUES (NEW.id, 'victim_id', OLD.victim_id::text, NEW.victim_id::text, NOW());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS cases_audit_trigger ON cases;

-- Create the trigger
CREATE TRIGGER cases_audit_trigger
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION audit_cases_changes();

-- Enums
DO $$ BEGIN CREATE TYPE activity_type AS ENUM ('call','meeting_online','visit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE activity_status AS ENUM ('scheduled','done','canceled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;



-- Core table (safe: v2)
CREATE TABLE IF NOT EXISTS sales_activity_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type activity_type NOT NULL,
  customer_id uuid NOT NULL REFERENCES organizations(id),
  pic_id uuid REFERENCES organization_contacts(id),
  opportunity_id uuid REFERENCES opportunities(id),
  new_opportunity_name text,
  scheduled_at timestamptz NOT NULL,
  status activity_status NOT NULL DEFAULT 'scheduled',
  notes text,
  mom_text text,
  mom_added_at timestamptz,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);



CREATE INDEX IF NOT EXISTS idx_sa_v2_customer ON sales_activity_v2 (customer_id, scheduled_at);



-- Attachments for MOM
CREATE TABLE IF NOT EXISTS activity_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES sales_activity_v2(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  byte_size bigint,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_att_activity ON activity_attachments(activity_id);



-- RLS
ALTER TABLE sales_activity_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_attachments ENABLE ROW LEVEL SECURITY;



-- Owner RW
DROP POLICY IF EXISTS sa_v2_owner_rw ON sales_activity_v2;
CREATE POLICY sa_v2_owner_rw
ON sales_activity_v2 FOR ALL TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());



-- Heads/admin READ (same division/department as creator)
DROP POLICY IF EXISTS sa_v2_heads_read ON sales_activity_v2;
CREATE POLICY sa_v2_heads_read
ON sales_activity_v2 FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_profiles me
    JOIN user_profiles creator ON creator.id = sales_activity_v2.created_by
    WHERE me.id = auth.uid()
      AND me.role IN ('division_head','department_head','admin')
      AND (me.division_id = creator.division_id OR me.department_id = creator.department_id)
  )
);



-- Attachments: owner RW; heads/admin READ
DROP POLICY IF EXISTS att_owner_rw ON activity_attachments;
CREATE POLICY att_owner_rw
ON activity_attachments FOR ALL TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());



DROP POLICY IF EXISTS att_heads_read ON activity_attachments;
CREATE POLICY att_heads_read
ON activity_attachments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM sales_activity_v2 a
    JOIN user_profiles me ON me.id = auth.uid()
    JOIN user_profiles creator ON creator.id = a.created_by
    WHERE a.id = activity_attachments.activity_id
      AND (activity_attachments.created_by = auth.uid()
        OR (me.role IN ('division_head','department_head','admin')
            AND (me.division_id = creator.division_id OR me.department_id = creator.department_id)))
  )
);



-- Trigger: require MOM before marking a Visit as 'done'
CREATE OR REPLACE FUNCTION ensure_visit_has_mom_v2()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE has_file boolean;
BEGIN
  IF (NEW.activity_type = 'visit' AND NEW.status = 'done') THEN
    SELECT EXISTS(SELECT 1 FROM activity_attachments WHERE activity_id = NEW.id)
      INTO has_file;
    IF (COALESCE(NEW.mom_text,'') = '' AND NOT has_file) THEN
      RAISE EXCEPTION 'Visit requires Minutes of Meeting (text or attachment) before marking as done';
    END IF;
    IF NEW.mom_text IS NOT NULL AND NEW.mom_added_at IS NULL THEN
      NEW.mom_added_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;



DROP TRIGGER IF EXISTS trg_visit_requires_mom_v2 ON sales_activity_v2;
CREATE TRIGGER trg_visit_requires_mom_v2
BEFORE UPDATE ON sales_activity_v2
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.mom_text IS DISTINCT FROM NEW.mom_text)
EXECUTE FUNCTION ensure_visit_has_mom_v2();
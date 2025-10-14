-- Enable extensions for search functionality
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Unified search source (materialized view for speed)
CREATE MATERIALIZED VIEW IF NOT EXISTS global_search_index AS
WITH opp AS (
  SELECT 
    o.id::text as rid, 
    'opportunity'::text as rtype,
    COALESCE(o.name,'') as title,
    COALESCE(up.full_name,'') as owner_name,
    (COALESCE(o.name,'') || ' ' ||
     COALESCE(up.full_name,'') || ' ' ||
     COALESCE(o.stage::text,'') || ' ' ||
     COALESCE(o.description,'')) as body,
    o.owner_id as account_manager_id,
    o.created_at
  FROM opportunities o
  LEFT JOIN user_profiles up ON up.id = o.owner_id
),
orgs AS (
  SELECT 
    org.id::text, 
    'organization'::text,
    COALESCE(org.name,'') as title,
    '' as owner_name,
    (COALESCE(org.name,'') || ' ' ||
     COALESCE(org.industry,'') || ' ' ||
     COALESCE(org.type,'')) as body,
    org.created_by as account_manager_id,
    org.created_at
  FROM organizations org
),
ct AS (
  SELECT 
    c.id::text, 
    'contact'::text,
    COALESCE(c.name,'') as title,
    '' as owner_name,
    (COALESCE(c.name,'') || ' ' ||
     COALESCE(c.email,'') || ' ' ||
     COALESCE(c.phone,'')) as body,
    c.user_id as account_manager_id,
    c.created_at
  FROM contacts c
),
act AS (
  SELECT 
    a.id::text, 
    'activity'::text,
    COALESCE(a.subject,'') as title,
    '' as owner_name,
    (COALESCE(a.subject,'') || ' ' ||
     COALESCE(a.description,'')) as body,
    a.created_by as account_manager_id,
    a.created_at
  FROM activities a
)
SELECT
  x.rid, x.rtype, x.title, x.owner_name, x.body, x.account_manager_id, x.created_at,
  setweight(to_tsvector('simple', unaccent(COALESCE(x.title,''))), 'A') ||
  setweight(to_tsvector('simple', unaccent(COALESCE(x.owner_name,''))), 'B') ||
  setweight(to_tsvector('simple', unaccent(COALESCE(x.body,''))), 'C') as search_vector
FROM (
  SELECT * FROM opp
  UNION ALL SELECT * FROM orgs
  UNION ALL SELECT * FROM ct
  UNION ALL SELECT * FROM act
) x;

-- Indexes for speed
CREATE INDEX IF NOT EXISTS gsi_tsv_idx ON global_search_index USING gin (search_vector);
CREATE INDEX IF NOT EXISTS gsi_trgm_title ON global_search_index USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS gsi_created_at ON global_search_index (created_at);

-- Manager-scoped search view
CREATE OR REPLACE VIEW manager_global_search AS
SELECT g.*
FROM global_search_index g
WHERE EXISTS (
  SELECT 1 
  FROM manager_team_members t 
  WHERE t.manager_id = auth.uid() 
    AND t.account_manager_id = g.account_manager_id
);

-- Search function for managers
CREATE OR REPLACE FUNCTION search_manager_data(search_query text)
RETURNS TABLE(
  rid text,
  rtype text,
  title text,
  owner_name text,
  body text,
  score real,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH fts AS (
    SELECT 
      g.rid, g.rtype, g.title, g.owner_name, g.body, g.created_at,
      ts_rank_cd(g.search_vector, plainto_tsquery('simple', unaccent(search_query))) as rank
    FROM manager_global_search g
    WHERE g.search_vector @@ plainto_tsquery('simple', unaccent(search_query))
  ),
  trgm AS (
    SELECT 
      g.rid, g.rtype, g.title, g.owner_name, g.body, g.created_at,
      similarity(unaccent(g.title), unaccent(search_query)) as sim
    FROM manager_global_search g
    WHERE unaccent(g.title) % unaccent(search_query)
  )
  SELECT s.rid, s.rtype, s.title, s.owner_name, s.body, s.score, s.created_at
  FROM (
    SELECT *, rank as score FROM fts
    UNION ALL
    SELECT *, sim as score FROM trgm
  ) s
  ORDER BY s.score DESC, s.created_at DESC
  LIMIT 20;
END;
$$;
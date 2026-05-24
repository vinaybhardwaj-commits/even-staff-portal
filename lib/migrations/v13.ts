/**
 * v1.7 Sprint A — Trace forensics schema upgrade.
 *
 * Adds 5 columns + 3 indexes on `traces` for the admin trace dashboard:
 *   - question_preview     : first 160 chars of the input question (fast list rendering, no JSONB lookup)
 *   - severity             : denormalized from critique event for filter chip
 *   - model_summary        : JSONB of which model ran each stage {draft, critique, revise}
 *   - final_answer_text    : denormalized full final answer text for tsvector + list preview
 *   - search_tsv           : GENERATED ALWAYS — tsvector over question_preview + final_answer_text
 *
 * Indexes:
 *   - traces_started_at_idx  : dashboard list sorted by started_at DESC
 *   - traces_search_gin      : free-text search across question + final answer
 *   - traces_user_started_idx: per-user trace lookups for "View trace" link auth
 *
 * Also adds example_questions table (Sprint G uses it; cheaper to ship the schema now).
 */
export const v13_sql = `
  ALTER TABLE traces ADD COLUMN IF NOT EXISTS question_preview TEXT;
  ALTER TABLE traces ADD COLUMN IF NOT EXISTS severity TEXT;
  ALTER TABLE traces ADD COLUMN IF NOT EXISTS model_summary JSONB;
  ALTER TABLE traces ADD COLUMN IF NOT EXISTS final_answer_text TEXT;

  -- GENERATED column for full-text search. Re-derives automatically on every UPDATE
  -- to question_preview / final_answer_text. Postgres stores it materialized for fast GIN.
  ALTER TABLE traces ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR
    GENERATED ALWAYS AS (
      to_tsvector('english', COALESCE(question_preview, '') || ' ' || COALESCE(final_answer_text, ''))
    ) STORED;

  CREATE INDEX IF NOT EXISTS traces_started_at_idx ON traces (started_at DESC);
  CREATE INDEX IF NOT EXISTS traces_search_gin ON traces USING GIN (search_tsv);
  CREATE INDEX IF NOT EXISTS traces_user_started_idx ON traces (user_id, started_at DESC);

  -- Sprint G uses this; ship schema here so we only run one migration.
  CREATE TABLE IF NOT EXISTS example_questions (
    id BIGSERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    specialty TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS example_questions_specialty_active_idx
    ON example_questions (specialty, active);
`;

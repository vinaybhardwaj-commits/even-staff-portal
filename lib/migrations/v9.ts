/**
 * Migration v9 — Portal CMS schema (per PRD §8, v0.5)
 *
 * 14 new tables + 7 ALTER on staff_complaints + seed data.
 * All statements idempotent: CREATE TABLE IF NOT EXISTS,
 * ADD COLUMN IF NOT EXISTS, ON CONFLICT DO NOTHING.
 * Safe to re-run on the shared CDMSS Neon DB.
 *
 * NOT touched: CDMSS tables (app_settings, traces, trace_events, chunks,
 * etc.). app_settings is reused per locked decision; we just ADD KEYS via
 * INSERT ON CONFLICT during runtime, never re-declare it.
 */

export const V9_STATEMENTS: { name: string; sql: string }[] = [
  // ───────────────────────────────────────────────────────────
  // 8.1 — Portal CMS tables
  // ───────────────────────────────────────────────────────────
  {
    name: 'content_items',
    sql: `CREATE TABLE IF NOT EXISTS content_items (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT,
      link TEXT,
      active BOOLEAN DEFAULT TRUE,
      pinned BOOLEAN DEFAULT FALSE,
      publish_at TIMESTAMPTZ DEFAULT NOW(),
      expire_at TIMESTAMPTZ,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'content_items_type_active_idx',
    sql: `CREATE INDEX IF NOT EXISTS content_items_type_active_idx ON content_items (type, active, publish_at DESC)`,
  },
  {
    name: 'contacts',
    sql: `CREATE TABLE IF NOT EXISTS contacts (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      department TEXT,
      extension TEXT,
      phone TEXT,
      email TEXT,
      pinned BOOLEAN DEFAULT FALSE,
      sort_order INT DEFAULT 100,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'resources',
    sql: `CREATE TABLE IF NOT EXISTS resources (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      category TEXT,
      icon TEXT,
      hero_image TEXT,
      pinned BOOLEAN DEFAULT FALSE,
      sort_order INT DEFAULT 100,
      active BOOLEAN DEFAULT TRUE,
      external BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'resources_pinned_idx',
    sql: `CREATE INDEX IF NOT EXISTS resources_pinned_idx ON resources (pinned DESC, sort_order, name)`,
  },
  {
    name: 'resources_url_unique',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS resources_url_unique ON resources (url)`,
  },

  // ───────────────────────────────────────────────────────────
  // 8.2 — Pilot apps
  // ───────────────────────────────────────────────────────────
  {
    name: 'pilot_apps',
    sql: `CREATE TABLE IF NOT EXISTS pilot_apps (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      long_description TEXT,
      status TEXT NOT NULL,
      owner_name TEXT,
      owner_email TEXT,
      open_url TEXT NOT NULL,
      screenshot_url TEXT,
      sort_order INT DEFAULT 100,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'pilot_apps_url_unique',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS pilot_apps_url_unique ON pilot_apps (open_url)`,
  },

  // ───────────────────────────────────────────────────────────
  // 8.3 — Videos
  // ───────────────────────────────────────────────────────────
  {
    name: 'videos',
    sql: `CREATE TABLE IF NOT EXISTS videos (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      source_type TEXT NOT NULL,
      blob_url TEXT,
      blob_path TEXT,
      youtube_url TEXT,
      youtube_video_id TEXT,
      mime_type TEXT,
      size_bytes BIGINT,
      duration_sec INT,
      thumbnail_url TEXT,
      uploaded_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      uploaded_by TEXT,
      soft_deleted_at TIMESTAMPTZ
    )`,
  },
  {
    name: 'videos_active_idx',
    sql: `CREATE INDEX IF NOT EXISTS videos_active_idx ON videos (soft_deleted_at, expires_at DESC)`,
  },

  // ───────────────────────────────────────────────────────────
  // 8.4 — Bulletin (nested comments per locked decision #15)
  // ───────────────────────────────────────────────────────────
  {
    name: 'bulletin_posts',
    sql: `CREATE TABLE IF NOT EXISTS bulletin_posts (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      attachment_url TEXT,
      author_display_name TEXT NOT NULL,
      author_email TEXT,
      pinned BOOLEAN DEFAULT FALSE,
      pinned_by TEXT,
      pinned_at TIMESTAMPTZ,
      hidden_by TEXT,
      hidden_at TIMESTAMPTZ,
      hidden_reason TEXT,
      last_activity_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'bulletin_posts_feed_idx',
    sql: `CREATE INDEX IF NOT EXISTS bulletin_posts_feed_idx ON bulletin_posts (pinned DESC, last_activity_at DESC)`,
  },
  {
    name: 'bulletin_comments',
    sql: `CREATE TABLE IF NOT EXISTS bulletin_comments (
      id BIGSERIAL PRIMARY KEY,
      post_id BIGINT NOT NULL REFERENCES bulletin_posts(id) ON DELETE CASCADE,
      parent_comment_id BIGINT REFERENCES bulletin_comments(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      author_display_name TEXT NOT NULL,
      author_email TEXT,
      hidden_by TEXT,
      hidden_at TIMESTAMPTZ,
      hidden_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'bulletin_comments_post_idx',
    sql: `CREATE INDEX IF NOT EXISTS bulletin_comments_post_idx ON bulletin_comments (post_id, created_at)`,
  },
  {
    name: 'bulletin_comments_parent_idx',
    sql: `CREATE INDEX IF NOT EXISTS bulletin_comments_parent_idx ON bulletin_comments (parent_comment_id)`,
  },

  // ───────────────────────────────────────────────────────────
  // 8.6 — Staff complaints + events (Sewa = staff complaints only per #25)
  // ───────────────────────────────────────────────────────────
  {
    name: 'staff_complaints',
    sql: `CREATE TABLE IF NOT EXISTS staff_complaints (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      confidential BOOLEAN DEFAULT FALSE,
      raised_by_display_name TEXT NOT NULL,
      assigned_to TEXT,
      resolution_notes TEXT,
      attachment_url TEXT,
      sla_due_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      ack_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ
    )`,
  },
  {
    name: 'staff_complaints_status_due_idx',
    sql: `CREATE INDEX IF NOT EXISTS staff_complaints_status_due_idx ON staff_complaints (status, sla_due_at)`,
  },
  {
    name: 'staff_complaints_severity_idx',
    sql: `CREATE INDEX IF NOT EXISTS staff_complaints_severity_idx ON staff_complaints (severity, status)`,
  },
  {
    name: 'staff_complaint_events',
    sql: `CREATE TABLE IF NOT EXISTS staff_complaint_events (
      id BIGSERIAL PRIMARY KEY,
      complaint_id BIGINT NOT NULL REFERENCES staff_complaints(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      actor TEXT,
      meta JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },

  // ───────────────────────────────────────────────────────────
  // 8.7 — Record versions (full version history per locked decision #28)
  // ───────────────────────────────────────────────────────────
  {
    name: 'record_versions',
    sql: `CREATE TABLE IF NOT EXISTS record_versions (
      id BIGSERIAL PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id BIGINT NOT NULL,
      version_num INT NOT NULL,
      snapshot JSONB NOT NULL,
      changed_by TEXT,
      changed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (entity_type, entity_id, version_num)
    )`,
  },
  {
    name: 'record_versions_entity_idx',
    sql: `CREATE INDEX IF NOT EXISTS record_versions_entity_idx ON record_versions (entity_type, entity_id, version_num DESC)`,
  },

  // ───────────────────────────────────────────────────────────
  // 8.8/8.9/8.10 — Sewa complaint type catalog (locked decisions #30-31)
  // ───────────────────────────────────────────────────────────
  {
    name: 'complaint_types',
    sql: `CREATE TABLE IF NOT EXISTS complaint_types (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      default_severity TEXT NOT NULL,
      sla_low_hours INT NOT NULL,
      sla_medium_hours INT NOT NULL,
      sla_high_hours INT NOT NULL,
      sla_critical_hours INT NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      retired_at TIMESTAMPTZ,
      sort_order INT DEFAULT 100,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'complaint_types_active_idx',
    sql: `CREATE INDEX IF NOT EXISTS complaint_types_active_idx ON complaint_types (active, sort_order)`,
  },
  {
    name: 'complaint_type_fields',
    sql: `CREATE TABLE IF NOT EXISTS complaint_type_fields (
      id BIGSERIAL PRIMARY KEY,
      complaint_type_id BIGINT NOT NULL REFERENCES complaint_types(id) ON DELETE CASCADE,
      field_slug TEXT NOT NULL,
      field_label TEXT NOT NULL,
      field_type TEXT NOT NULL,
      field_options JSONB,
      required BOOLEAN DEFAULT FALSE,
      sort_order INT DEFAULT 100,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (complaint_type_id, field_slug)
    )`,
  },
  {
    name: 'complaint_type_fields_type_idx',
    sql: `CREATE INDEX IF NOT EXISTS complaint_type_fields_type_idx ON complaint_type_fields (complaint_type_id, active, sort_order)`,
  },
  {
    name: 'complaint_resolutions',
    sql: `CREATE TABLE IF NOT EXISTS complaint_resolutions (
      id BIGSERIAL PRIMARY KEY,
      complaint_type_id BIGINT NOT NULL REFERENCES complaint_types(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      label TEXT NOT NULL,
      icon TEXT,
      requires_note BOOLEAN DEFAULT FALSE,
      sort_order INT DEFAULT 100,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (complaint_type_id, slug)
    )`,
  },
  {
    name: 'complaint_resolutions_type_idx',
    sql: `CREATE INDEX IF NOT EXISTS complaint_resolutions_type_idx ON complaint_resolutions (complaint_type_id, active, sort_order)`,
  },

  // ───────────────────────────────────────────────────────────
  // 8.11 — staff_complaints column additions (locked decisions #30, #31, #32)
  // ───────────────────────────────────────────────────────────
  {
    name: 'staff_complaints_alter_complaint_type_id',
    sql: `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS complaint_type_id BIGINT REFERENCES complaint_types(id)`,
  },
  {
    name: 'staff_complaints_alter_custom_fields',
    sql: `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS custom_fields JSONB`,
  },
  {
    name: 'staff_complaints_alter_resolution_id',
    sql: `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS resolution_id BIGINT REFERENCES complaint_resolutions(id)`,
  },
  {
    name: 'staff_complaints_alter_resolution_is_other',
    sql: `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS resolution_is_other BOOLEAN DEFAULT FALSE`,
  },
  {
    name: 'staff_complaints_alter_resolution_required_note_at_save',
    sql: `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS resolution_required_note_at_save BOOLEAN`,
  },
  {
    name: 'staff_complaints_alter_tags',
    sql: `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'`,
  },
  {
    name: 'staff_complaints_alter_soft_deleted_at',
    sql: `ALTER TABLE staff_complaints ADD COLUMN IF NOT EXISTS soft_deleted_at TIMESTAMPTZ`,
  },
  {
    name: 'staff_complaints_type_idx',
    sql: `CREATE INDEX IF NOT EXISTS staff_complaints_type_idx ON staff_complaints (complaint_type_id, status)`,
  },
  {
    name: 'staff_complaints_tags_idx',
    sql: `CREATE INDEX IF NOT EXISTS staff_complaints_tags_idx ON staff_complaints USING GIN (tags)`,
  },

  // ───────────────────────────────────────────────────────────
  // 8.12 — admin_actions audit log
  // ───────────────────────────────────────────────────────────
  {
    name: 'admin_actions',
    sql: `CREATE TABLE IF NOT EXISTS admin_actions (
      id BIGSERIAL PRIMARY KEY,
      actor_name TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id BIGINT,
      meta JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
  {
    name: 'admin_actions_created_idx',
    sql: `CREATE INDEX IF NOT EXISTS admin_actions_created_idx ON admin_actions (created_at DESC)`,
  },

  // ───────────────────────────────────────────────────────────
  // app_settings — REUSED from CDMSS v8 per PRD §8.8 final note.
  // We do NOT redeclare the table; we just need it to exist so portal
  // routes can read/write keys (home_video_id, emergency_message, etc).
  // CREATE TABLE IF NOT EXISTS is safe — if CDMSS already created it,
  // this is a no-op. If a brand-new Neon instance, this creates it.
  // ───────────────────────────────────────────────────────────
  {
    name: 'app_settings_safety_net',
    sql: `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  },
];

// ───────────────────────────────────────────────────────────
// Seed data — idempotent via ON CONFLICT on natural keys
// ───────────────────────────────────────────────────────────

export const V9_SEEDS: { name: string; sql: string }[] = [
  // Resources (5 entries per PRD §8 final note — KareXpert, Pulse, Chart, Cureus, sniv3r2-UpToDate)
  {
    name: 'seed_resource_karexpert',
    sql: `INSERT INTO resources (name, description, url, category, icon, pinned, sort_order)
      VALUES ('KareXpert HIS', 'Hospital information system — patient records, billing, OPD/IPD', 'https://even.karexpert.com/account-management/login', 'HIS', '🏥', TRUE, 10)
      ON CONFLICT (url) DO NOTHING`,
  },
  {
    name: 'seed_resource_pulse',
    sql: `INSERT INTO resources (name, description, url, category, icon, pinned, sort_order)
      VALUES ('Pulse', 'Even operations dashboard — live hospital metrics', 'https://pulse.even.in/', 'HIS', '📊', TRUE, 20)
      ON CONFLICT (url) DO NOTHING`,
  },
  {
    name: 'seed_resource_chart',
    sql: `INSERT INTO resources (name, description, url, category, icon, pinned, sort_order)
      VALUES ('Chart', 'Even charting / EMR', 'https://chart.even.in/', 'HIS', '📝', TRUE, 30)
      ON CONFLICT (url) DO NOTHING`,
  },
  {
    name: 'seed_resource_cureus',
    sql: `INSERT INTO resources (name, description, url, category, icon, sort_order)
      VALUES ('Cureus Newsroom', 'Open-access medical journal — latest articles, specialty highlights', 'https://www.cureus.com/newsroom', 'Clinical reference', '📰', 50)
      ON CONFLICT (url) DO NOTHING`,
  },
  {
    name: 'seed_resource_uptodate',
    sql: `INSERT INTO resources (name, description, url, category, icon, sort_order)
      VALUES ('UpToDate Clinical Reference', 'Evidence-based clinical decision support', 'https://sniv3r2.github.io/', 'Clinical reference', '📖', 60)
      ON CONFLICT (url) DO NOTHING`,
  },

  // Pilot app — OPD Encounter App with V as owner
  {
    name: 'seed_pilot_opd_encounter',
    sql: `INSERT INTO pilot_apps (name, description, long_description, status, owner_name, owner_email, open_url, sort_order)
      VALUES (
        'OPD Encounter App',
        'Multi-actor OPD flow: reception → triage → doctor → lab → dispatch. Voice transcription, ambient recording, Qwen DDx, lab vision extract.',
        'Demo of an end-to-end OPD encounter app built on Even infrastructure (Neon + Vercel + Ollama bridge). Five role tiers (CCE, triage nurse, doctor, lab tech, admin) with live SSE sync, multi-doctor handoff, and PDF dispatch via Twilio. Use for ideation and feedback on what we''d want a future OPD module to look like.',
        'beta',
        'V',
        'vinay.bhardwaj@even.in',
        'https://opd-encounter-app-vinaybhardwaj-commits-projects.vercel.app/',
        10
      )
      ON CONFLICT (open_url) DO NOTHING`,
  },

  // Starter complaint types — 6 types per PRD §8 final note
  {
    name: 'seed_ctype_equipment',
    sql: `INSERT INTO complaint_types (slug, name, description, icon, default_severity, sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours, sort_order)
      VALUES ('equipment-fault', 'Equipment fault', 'Broken or malfunctioning equipment (ECG, vitals monitor, pumps, beds, etc.)', '🩺', 'high', 48, 24, 8, 2, 10)
      ON CONFLICT (slug) DO NOTHING`,
  },
  {
    name: 'seed_ctype_supply',
    sql: `INSERT INTO complaint_types (slug, name, description, icon, default_severity, sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours, sort_order)
      VALUES ('supply-shortage', 'Supply shortage', 'Out-of-stock or running-low items (consumables, PPE, meds, linen)', '📦', 'medium', 72, 24, 8, 2, 20)
      ON CONFLICT (slug) DO NOTHING`,
  },
  {
    name: 'seed_ctype_process',
    sql: `INSERT INTO complaint_types (slug, name, description, icon, default_severity, sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours, sort_order)
      VALUES ('process-issue', 'Process / SOP issue', 'Workflow problem, unclear SOP, handover gap, scheduling friction', '🔄', 'medium', 96, 48, 24, 8, 30)
      ON CONFLICT (slug) DO NOTHING`,
  },
  {
    name: 'seed_ctype_interpersonal',
    sql: `INSERT INTO complaint_types (slug, name, description, icon, default_severity, sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours, sort_order)
      VALUES ('interpersonal', 'Interpersonal concern', 'Team friction, communication issue, professionalism concern (confidential by default)', '🤝', 'medium', 96, 48, 24, 8, 40)
      ON CONFLICT (slug) DO NOTHING`,
  },
  {
    name: 'seed_ctype_safety',
    sql: `INSERT INTO complaint_types (slug, name, description, icon, default_severity, sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours, sort_order)
      VALUES ('safety-incident', 'Safety incident', 'Patient safety, staff safety, near-miss, infection-control breach', '⚠️', 'critical', 24, 8, 4, 1, 50)
      ON CONFLICT (slug) DO NOTHING`,
  },
  {
    name: 'seed_ctype_other',
    sql: `INSERT INTO complaint_types (slug, name, description, icon, default_severity, sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours, sort_order)
      VALUES ('other', 'Other', 'Anything that doesn''t fit the other categories', '💬', 'medium', 96, 48, 24, 8, 100)
      ON CONFLICT (slug) DO NOTHING`,
  },

  // Custom fields for Equipment fault (most common need: asset tag + location)
  {
    name: 'seed_field_equipment_asset_tag',
    sql: `INSERT INTO complaint_type_fields (complaint_type_id, field_slug, field_label, field_type, required, sort_order)
      SELECT id, 'asset_tag', 'Equipment ID / asset tag', 'text', TRUE, 10 FROM complaint_types WHERE slug='equipment-fault'
      ON CONFLICT (complaint_type_id, field_slug) DO NOTHING`,
  },
  {
    name: 'seed_field_equipment_location',
    sql: `INSERT INTO complaint_type_fields (complaint_type_id, field_slug, field_label, field_type, required, sort_order)
      SELECT id, 'location', 'Location (ward / room)', 'text', TRUE, 20 FROM complaint_types WHERE slug='equipment-fault'
      ON CONFLICT (complaint_type_id, field_slug) DO NOTHING`,
  },

  // Custom field for Supply shortage
  {
    name: 'seed_field_supply_item',
    sql: `INSERT INTO complaint_type_fields (complaint_type_id, field_slug, field_label, field_type, required, sort_order)
      SELECT id, 'item_name', 'Item that''s short', 'text', TRUE, 10 FROM complaint_types WHERE slug='supply-shortage'
      ON CONFLICT (complaint_type_id, field_slug) DO NOTHING`,
  },

  // Common resolutions per type
  {
    name: 'seed_res_equipment_repaired',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'repaired-in-place', 'Repaired in-place', '🔧', FALSE, 10 FROM complaint_types WHERE slug='equipment-fault'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
  {
    name: 'seed_res_equipment_replaced',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'replaced-from-stock', 'Replaced from stock', '🔁', FALSE, 20 FROM complaint_types WHERE slug='equipment-fault'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
  {
    name: 'seed_res_equipment_sent_external',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'sent-for-external-repair', 'Sent for external repair', '📤', TRUE, 30 FROM complaint_types WHERE slug='equipment-fault'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
  {
    name: 'seed_res_supply_restocked',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'restocked', 'Restocked', '📦', FALSE, 10 FROM complaint_types WHERE slug='supply-shortage'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
  {
    name: 'seed_res_supply_ordered',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'ordered-eta-given', 'Ordered — ETA given', '🛒', TRUE, 20 FROM complaint_types WHERE slug='supply-shortage'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
  {
    name: 'seed_res_process_sop_updated',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'sop-updated', 'SOP updated', '📋', TRUE, 10 FROM complaint_types WHERE slug='process-issue'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
  {
    name: 'seed_res_process_discussed',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'discussed-team', 'Discussed with team', '💬', TRUE, 20 FROM complaint_types WHERE slug='process-issue'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
  {
    name: 'seed_res_safety_addressed',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'incident-addressed', 'Incident addressed + RCA filed', '✅', TRUE, 10 FROM complaint_types WHERE slug='safety-incident'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
  {
    name: 'seed_res_interpersonal_mediated',
    sql: `INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
      SELECT id, 'mediated', 'Mediated', '🤝', TRUE, 10 FROM complaint_types WHERE slug='interpersonal'
      ON CONFLICT (complaint_type_id, slug) DO NOTHING`,
  },
];

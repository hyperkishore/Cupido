-- ============================================
-- PROMPTS VERSION CONTROL SYSTEM
-- ============================================
-- This table stores ALL prompt versions with full history
-- Prompts are NEVER deleted - only new versions created
-- Each change creates a new row with incremented version

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  prompt_id TEXT NOT NULL,  -- Stable identifier (e.g., "critical_rules", "self_discovery")
  prompt_name TEXT NOT NULL,

  -- Version tracking (semantic versioning)
  major_version INTEGER NOT NULL DEFAULT 1,
  minor_version INTEGER NOT NULL DEFAULT 0,
  patch_version INTEGER NOT NULL DEFAULT 0,
  version_string TEXT GENERATED ALWAYS AS (major_version || '.' || minor_version || '.' || patch_version) STORED,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'active', 'archived', 'deprecated'
  is_active BOOLEAN NOT NULL DEFAULT FALSE,  -- Only ONE version can be active per prompt_id

  -- Content
  system_prompt TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'conversation',
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin',
  commit_message TEXT,
  notes TEXT,
  parent_version_id UUID REFERENCES prompt_versions(id),  -- Track version lineage

  -- Labels for organizing
  labels TEXT[] DEFAULT '{}',  -- e.g., ['production', 'testing', 'experimental']

  -- Source tracking
  source_file TEXT,  -- Original file if imported (e.g., "prompts.json")
  is_default BOOLEAN DEFAULT FALSE,  -- Mark as application default prompt

  -- Constraints
  CONSTRAINT unique_version UNIQUE (prompt_id, major_version, minor_version, patch_version),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'archived', 'deprecated')),
  CONSTRAINT active_version_check CHECK (
    (is_active = TRUE AND status = 'active') OR
    (is_active = FALSE)
  )
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Find latest version for a prompt
CREATE INDEX idx_prompts_id_version ON prompt_versions(prompt_id, major_version DESC, minor_version DESC, patch_version DESC);

-- Find active versions
CREATE INDEX idx_prompts_active ON prompt_versions(prompt_id, is_active) WHERE is_active = TRUE;

-- Search by category/tags
CREATE INDEX idx_prompts_category ON prompt_versions(category);
CREATE INDEX idx_prompts_tags ON prompt_versions USING GIN(tags);
CREATE INDEX idx_prompts_labels ON prompt_versions USING GIN(labels);

-- Time-based queries
CREATE INDEX idx_prompts_created ON prompt_versions(created_at DESC);

-- ============================================
-- TRIGGER: ENSURE ONLY ONE ACTIVE VERSION
-- ============================================
-- When a version is set to active, deactivate all other versions of same prompt

CREATE OR REPLACE FUNCTION ensure_single_active_prompt()
RETURNS TRIGGER AS $$
BEGIN
  -- If this version is being set to active
  IF NEW.is_active = TRUE THEN
    -- Deactivate all other versions of the same prompt
    UPDATE prompt_versions
    SET
      is_active = FALSE,
      status = CASE
        WHEN status = 'active' THEN 'archived'
        ELSE status
      END
    WHERE prompt_id = NEW.prompt_id
      AND id != NEW.id
      AND is_active = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_prompt
  BEFORE INSERT OR UPDATE ON prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_prompt();

-- ============================================
-- HELPER FUNCTION: GET ACTIVE PROMPT
-- ============================================

CREATE OR REPLACE FUNCTION get_active_prompt(p_prompt_id TEXT)
RETURNS TABLE (
  id UUID,
  prompt_id TEXT,
  prompt_name TEXT,
  version_string TEXT,
  system_prompt TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  labels TEXT[],
  created_at TIMESTAMPTZ,
  is_default BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id,
    pv.prompt_id,
    pv.prompt_name,
    pv.version_string,
    pv.system_prompt,
    pv.description,
    pv.category,
    pv.tags,
    pv.labels,
    pv.created_at,
    pv.is_default
  FROM prompt_versions pv
  WHERE pv.prompt_id = p_prompt_id
    AND pv.is_active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: CREATE NEW VERSION
-- ============================================

CREATE OR REPLACE FUNCTION create_prompt_version(
  p_prompt_id TEXT,
  p_prompt_name TEXT,
  p_system_prompt TEXT,
  p_version_type TEXT,  -- 'major', 'minor', 'patch'
  p_commit_message TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT 'admin',
  p_activate BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
  v_current_major INT;
  v_current_minor INT;
  v_current_patch INT;
  v_parent_id UUID;
BEGIN
  -- Get current version numbers
  SELECT
    major_version,
    minor_version,
    patch_version,
    id
  INTO
    v_current_major,
    v_current_minor,
    v_current_patch,
    v_parent_id
  FROM prompt_versions
  WHERE prompt_id = p_prompt_id
    AND is_active = TRUE;

  -- If no active version exists, start from 1.0.0
  IF NOT FOUND THEN
    v_current_major := 1;
    v_current_minor := 0;
    v_current_patch := 0;
    v_parent_id := NULL;
  ELSE
    -- Increment based on version type
    CASE p_version_type
      WHEN 'major' THEN
        v_current_major := v_current_major + 1;
        v_current_minor := 0;
        v_current_patch := 0;
      WHEN 'minor' THEN
        v_current_minor := v_current_minor + 1;
        v_current_patch := 0;
      ELSE  -- 'patch' or default
        v_current_patch := v_current_patch + 1;
    END CASE;
  END IF;

  -- Insert new version
  INSERT INTO prompt_versions (
    prompt_id,
    prompt_name,
    major_version,
    minor_version,
    patch_version,
    system_prompt,
    status,
    is_active,
    commit_message,
    notes,
    created_by,
    parent_version_id
  ) VALUES (
    p_prompt_id,
    p_prompt_name,
    v_current_major,
    v_current_minor,
    v_current_patch,
    p_system_prompt,
    CASE WHEN p_activate THEN 'active' ELSE 'draft' END,
    p_activate,
    p_commit_message,
    p_notes,
    p_created_by,
    v_parent_id
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GIT COMMIT TRACKING TABLE
-- ============================================
-- Track git commits when prompts are updated

CREATE TABLE IF NOT EXISTS prompt_git_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id),
  git_commit_hash TEXT,
  git_branch TEXT DEFAULT 'main',
  git_author TEXT,
  git_message TEXT,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_git_commit UNIQUE (prompt_version_id, git_commit_hash)
);

CREATE INDEX idx_git_commits_version ON prompt_git_commits(prompt_version_id);
CREATE INDEX idx_git_commits_hash ON prompt_git_commits(git_commit_hash);

-- ============================================
-- ROW LEVEL SECURITY (Enable but allow all for now)
-- ============================================

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_git_commits ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can add user-based policies later)
CREATE POLICY "Allow all prompt operations" ON prompt_versions FOR ALL USING (true);
CREATE POLICY "Allow all git commit operations" ON prompt_git_commits FOR ALL USING (true);

-- ============================================
-- SEED DATA: Import from existing prompts.json
-- ============================================

COMMENT ON TABLE prompt_versions IS 'Version-controlled prompt storage. Prompts are NEVER deleted - only new versions created. Each change creates a new row with Git trace.';
COMMENT ON COLUMN prompt_versions.is_active IS 'Only ONE version per prompt_id can be active. Enforced by trigger.';
COMMENT ON COLUMN prompt_versions.parent_version_id IS 'Points to previous version for lineage tracking';
COMMENT ON FUNCTION create_prompt_version IS 'Helper function to create new prompt version with automatic version incrementing';

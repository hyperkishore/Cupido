-- ============================================
-- APP VERSIONS TABLE
-- ============================================
-- Stores app version history with git commit tracking

CREATE TABLE IF NOT EXISTS app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Version Information
  major_version INTEGER NOT NULL DEFAULT 1,
  minor_version INTEGER NOT NULL DEFAULT 0,
  patch_version INTEGER NOT NULL DEFAULT 0,
  version_string TEXT GENERATED ALWAYS AS (
    major_version || '.' || minor_version || '.' || patch_version
  ) STORED,

  -- Git Information
  git_commit_hash TEXT,
  git_branch TEXT DEFAULT 'main',
  git_commit_message TEXT,

  -- Metadata
  release_notes TEXT,
  is_production BOOLEAN DEFAULT false,
  is_latest BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,

  -- Unique constraint on version
  UNIQUE(major_version, minor_version, patch_version)
);

-- Index for faster queries
CREATE INDEX idx_app_versions_latest ON app_versions(is_latest) WHERE is_latest = true;
CREATE INDEX idx_app_versions_production ON app_versions(is_production) WHERE is_production = true;
CREATE INDEX idx_app_versions_created ON app_versions(created_at DESC);

-- Trigger to ensure only one version is marked as latest
CREATE OR REPLACE FUNCTION ensure_single_latest_app_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_latest = true THEN
    -- Set all other versions to not latest
    UPDATE app_versions
    SET is_latest = false
    WHERE is_latest = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_latest_app_version
  BEFORE INSERT OR UPDATE ON app_versions
  FOR EACH ROW
  WHEN (NEW.is_latest = true)
  EXECUTE FUNCTION ensure_single_latest_app_version();

-- Function to increment app version
CREATE OR REPLACE FUNCTION increment_app_version(
  version_type TEXT DEFAULT 'patch',
  git_hash TEXT DEFAULT NULL,
  git_msg TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  latest_version RECORD;
  new_major INTEGER;
  new_minor INTEGER;
  new_patch INTEGER;
  new_version_id UUID;
BEGIN
  -- Get the latest version
  SELECT * INTO latest_version
  FROM app_versions
  WHERE is_latest = true
  LIMIT 1;

  -- If no version exists, start with 1.0.0
  IF latest_version IS NULL THEN
    new_major := 1;
    new_minor := 0;
    new_patch := 0;
  ELSE
    -- Increment based on version type
    CASE version_type
      WHEN 'major' THEN
        new_major := latest_version.major_version + 1;
        new_minor := 0;
        new_patch := 0;
      WHEN 'minor' THEN
        new_major := latest_version.major_version;
        new_minor := latest_version.minor_version + 1;
        new_patch := 0;
      ELSE -- 'patch'
        new_major := latest_version.major_version;
        new_minor := latest_version.minor_version;
        new_patch := latest_version.patch_version + 1;
    END CASE;
  END IF;

  -- Insert new version
  INSERT INTO app_versions (
    major_version,
    minor_version,
    patch_version,
    git_commit_hash,
    git_commit_message,
    release_notes,
    is_latest
  ) VALUES (
    new_major,
    new_minor,
    new_patch,
    git_hash,
    git_msg,
    notes,
    true
  )
  RETURNING id INTO new_version_id;

  RETURN new_version_id;
END;
$$ LANGUAGE plpgsql;

-- Insert initial version from package.json (1.0.0)
INSERT INTO app_versions (
  major_version,
  minor_version,
  patch_version,
  git_commit_message,
  release_notes,
  is_latest,
  is_production
) VALUES (
  1,
  0,
  0,
  'Initial version from package.json',
  'Base version of Cupido dating app',
  true,
  true
) ON CONFLICT (major_version, minor_version, patch_version) DO NOTHING;

-- Enable RLS
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read app versions
CREATE POLICY "Allow public read access to app_versions"
  ON app_versions
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert/update
CREATE POLICY "Allow authenticated insert to app_versions"
  ON app_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to app_versions"
  ON app_versions
  FOR UPDATE
  TO authenticated
  USING (true);

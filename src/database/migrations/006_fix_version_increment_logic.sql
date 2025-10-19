-- ============================================
-- FIX VERSION INCREMENT LOGIC
-- ============================================
-- Problem: create_prompt_version was using is_active = TRUE to find base version
-- This caused duplicate key errors when creating versions from older versions
-- Solution: Use the LATEST version (highest version number) instead

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
  -- Get LATEST version numbers (not active, but highest version)
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
  ORDER BY major_version DESC, minor_version DESC, patch_version DESC
  LIMIT 1;

  -- If no version exists, start from 1.0.0
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

COMMENT ON FUNCTION create_prompt_version IS 'Creates new prompt version based on LATEST (highest) version number, not active version. Prevents duplicate key errors when creating versions from older versions.';

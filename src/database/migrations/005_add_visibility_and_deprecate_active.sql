-- ============================================
-- ADD VISIBILITY CONTROL & DEPRECATE is_active
-- ============================================
-- This migration adds is_visible for controlling which prompts
-- show in the app, and prepares to deprecate is_active in favor
-- of using is_default for system-wide default prompt selection.

-- Add is_visible column (defaults to true for existing prompts)
ALTER TABLE prompt_versions
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Create index for visibility queries
CREATE INDEX IF NOT EXISTS idx_prompts_visible
ON prompt_versions(is_visible)
WHERE is_visible = TRUE;

-- Add comment explaining the new field
COMMENT ON COLUMN prompt_versions.is_visible IS 'Controls whether this prompt appears in the app dropdown. Hidden prompts can still be used via direct selection but won''t appear in the UI.';

-- NOTE: We're keeping is_active for now for backward compatibility,
-- but the system will transition to using is_default for marking
-- the system default prompt, and is_visible for controlling UI display.
-- User selections will be stored per-user and override the default.

-- Migration: Add Dating Profile Fields to profiles table
-- Run this in Supabase SQL Editor

-- Add dating-essential fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'other', 'prefer-not-to-say'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location JSONB;

-- Add matching preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_goals TEXT CHECK (relationship_goals IN ('casual', 'serious', 'friendship', 'not-sure'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_range_preference JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_distance INTEGER;

-- Add optional profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height INTEGER; -- in centimeters
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Add lifestyle preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smoking TEXT CHECK (smoking IN ('yes', 'no', 'sometimes', 'prefer-not-to-say'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drinking TEXT CHECK (drinking IN ('yes', 'no', 'sometimes', 'prefer-not-to-say'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_kids BOOLEAN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_kids TEXT CHECK (wants_kids IN ('yes', 'no', 'maybe', 'prefer-not-to-say'));

-- Add verification status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_verified BOOLEAN DEFAULT false;

-- Add profile completion tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for ON profiles USING GIN (looking_for);
CREATE INDEX IF NOT EXISTS idx_profiles_relationship_goals ON profiles(relationship_goals);
CREATE INDEX IF NOT EXISTS idx_profiles_is_profile_complete ON profiles(is_profile_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth ON profiles(date_of_birth);

-- Add comments for documentation
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth for age verification (must be 18+)';
COMMENT ON COLUMN profiles.gender IS 'User gender identity';
COMMENT ON COLUMN profiles.bio IS 'User bio/about section (min 50 chars recommended)';
COMMENT ON COLUMN profiles.photos IS 'Array of photo URLs from Supabase Storage';
COMMENT ON COLUMN profiles.location IS 'User location as JSONB: {city, state, country, coordinates: {lat, lng}}';
COMMENT ON COLUMN profiles.looking_for IS 'Array of gender preferences for matching';
COMMENT ON COLUMN profiles.interests IS 'Array of user interests/hobbies';
COMMENT ON COLUMN profiles.profile_completeness IS 'Profile completion percentage (0-100)';

-- Create trigger to auto-update email_verified from auth.users
CREATE OR REPLACE FUNCTION sync_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_verified();

-- Backfill email_verified for existing users
UPDATE profiles
SET email_verified = (
  SELECT email_confirmed_at IS NOT NULL
  FROM auth.users
  WHERE auth.users.id = profiles.id
);

COMMENT ON FUNCTION sync_email_verified IS 'Auto-sync email_verified status from auth.users to profiles';

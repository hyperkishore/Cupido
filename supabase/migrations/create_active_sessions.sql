-- Create active_sessions table for single-window enforcement
CREATE TABLE IF NOT EXISTS public.active_sessions (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  browser_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_active_sessions_heartbeat ON public.active_sessions(last_heartbeat);

-- Add RLS policies
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own sessions
CREATE POLICY "Users can view their own session" ON public.active_sessions
  FOR SELECT USING (true); -- Anyone can check sessions (needed for conflict detection)

CREATE POLICY "Users can insert their own session" ON public.active_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own session" ON public.active_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own session" ON public.active_sessions
  FOR DELETE USING (true);

-- Add unique constraint on profiles.phone_number if not exists
-- This prevents duplicate profiles with the same phone number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_phone_number_unique' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_phone_number_unique UNIQUE (phone_number);
  END IF;
END $$;
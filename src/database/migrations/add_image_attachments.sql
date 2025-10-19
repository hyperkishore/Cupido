-- Image Attachments Table for Chat Messages
-- Run this migration in your Supabase SQL Editor

-- Image attachments table
CREATE TABLE IF NOT EXISTS image_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Image data
  image_data TEXT NOT NULL,  -- Base64 encoded image
  mime_type TEXT NOT NULL,   -- image/jpeg, image/png, etc.
  file_size INTEGER,         -- Size in bytes
  width INTEGER,
  height INTEGER,

  -- AI Analysis
  ai_analysis TEXT,          -- Claude's analysis of the image
  ai_analysis_metadata JSONB DEFAULT '{}',  -- Structured analysis data

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_attachments_message_id ON image_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_image_attachments_conversation_id ON image_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_image_attachments_user_id ON image_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_image_attachments_created_at ON image_attachments(created_at DESC);

-- Row Level Security
ALTER TABLE image_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_attachments
CREATE POLICY "Users can view images in their conversations" ON image_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = image_attachments.conversation_id
      AND (user_id::text = auth.uid()::text OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can insert images in their conversations" ON image_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = image_attachments.conversation_id
      AND (user_id::text = auth.uid()::text OR auth.uid() IS NULL)
    )
  );

-- Grant permissions for real-time and CRUD operations
GRANT SELECT, INSERT ON image_attachments TO anon, authenticated;

-- Enable real-time for image_attachments
ALTER PUBLICATION supabase_realtime ADD TABLE image_attachments;

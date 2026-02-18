
-- Add AI-generated message field to follow_ups
ALTER TABLE public.follow_ups
  ADD COLUMN IF NOT EXISTS suggested_message text,
  ADD COLUMN IF NOT EXISTS message_generated_at timestamptz;

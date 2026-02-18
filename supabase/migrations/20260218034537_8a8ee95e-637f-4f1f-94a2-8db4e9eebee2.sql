
-- Add sequence tracking to follow_ups
ALTER TABLE public.follow_ups 
  ADD COLUMN IF NOT EXISTS step integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_steps integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS sequence_type text NOT NULL DEFAULT 'payment_reminder',
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS pause_reason text;

-- Index for the cron job to efficiently find pending follow-ups
CREATE INDEX IF NOT EXISTS idx_follow_ups_pending_due 
  ON public.follow_ups (status, due_at) 
  WHERE status = 'pending';

-- Index to quickly find follow-ups by order for deduplication
CREATE INDEX IF NOT EXISTS idx_follow_ups_order_sequence 
  ON public.follow_ups (order_id, sequence_type, step);

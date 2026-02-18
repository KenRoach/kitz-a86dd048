
-- Inbox messages table for forwarded emails
CREATE TABLE public.inbox_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  direction TEXT NOT NULL DEFAULT 'inbound',
  sender_name TEXT,
  sender_email TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inbox messages"
  ON public.inbox_messages
  FOR ALL
  USING (auth.uid() = user_id);

-- Allow service role inserts (for webhook)
CREATE POLICY "Service role can insert inbox messages"
  ON public.inbox_messages
  FOR INSERT
  WITH CHECK (true);

-- Index for fast queries
CREATE INDEX idx_inbox_messages_user_created ON public.inbox_messages (user_id, created_at DESC);
CREATE INDEX idx_inbox_messages_channel ON public.inbox_messages (user_id, channel);

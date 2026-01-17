-- Add 'consultant' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consultant';

-- Create consultant_contacts table with the 4-stage funnel
CREATE TABLE public.consultant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'email', 'link', 'referral', 'instagram', 'other')),
  funnel_stage TEXT NOT NULL DEFAULT 'atraccion' CHECK (funnel_stage IN ('atraccion', 'nutricion', 'conversacion', 'retencion')),
  stage_entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_high_attention BOOLEAN DEFAULT false,
  payment_pending BOOLEAN DEFAULT false,
  payment_sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  attendance_confirmed BOOLEAN DEFAULT false,
  calendar_reminder_sent BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultant_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for consultant_contacts
CREATE POLICY "Users can view their own consultant contacts"
  ON public.consultant_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consultant contacts"
  ON public.consultant_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultant contacts"
  ON public.consultant_contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consultant contacts"
  ON public.consultant_contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_consultant_contacts_updated_at
  BEFORE UPDATE ON public.consultant_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_consultant_contacts_user_stage ON public.consultant_contacts(user_id, funnel_stage);
CREATE INDEX idx_consultant_contacts_last_interaction ON public.consultant_contacts(last_interaction DESC);
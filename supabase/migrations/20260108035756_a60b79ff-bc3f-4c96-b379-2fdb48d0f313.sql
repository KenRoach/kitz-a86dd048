-- Create habits table for cross-device sync
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  completed_dates TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own habits
CREATE POLICY "Users can view their own habits"
ON public.habits FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own habits
CREATE POLICY "Users can create their own habits"
ON public.habits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own habits
CREATE POLICY "Users can update their own habits"
ON public.habits FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own habits
CREATE POLICY "Users can delete their own habits"
ON public.habits FOR DELETE
USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
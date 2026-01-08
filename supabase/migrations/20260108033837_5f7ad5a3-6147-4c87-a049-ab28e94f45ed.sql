-- Create content calendar table for scheduling posts
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  content_type TEXT DEFAULT 'post',
  notes TEXT,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calendar items"
ON public.content_calendar FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar items"
ON public.content_calendar FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar items"
ON public.content_calendar FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar items"
ON public.content_calendar FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_content_calendar_updated_at
BEFORE UPDATE ON public.content_calendar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
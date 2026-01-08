-- Table for 4DX Weekly Commitments (Cadence)
CREATE TABLE public.user_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  commitment TEXT NOT NULL,
  week_start DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_commitments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own commitments" 
ON public.user_commitments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commitments" 
ON public.user_commitments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commitments" 
ON public.user_commitments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commitments" 
ON public.user_commitments FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_commitments_updated_at
BEFORE UPDATE ON public.user_commitments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
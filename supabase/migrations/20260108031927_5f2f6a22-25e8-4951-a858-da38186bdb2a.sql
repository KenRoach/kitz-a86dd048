-- Table for 4DX Goals (WIG + Lead Measures)
CREATE TABLE public.user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- WIG (Wildly Important Goal)
  wig_type TEXT NOT NULL DEFAULT 'revenue',
  wig_target DECIMAL NOT NULL DEFAULT 500,
  wig_period TEXT NOT NULL DEFAULT 'weekly',
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('week', now()),
  
  -- Lead Measures Targets
  storefronts_target INTEGER NOT NULL DEFAULT 5,
  followups_target INTEGER NOT NULL DEFAULT 10,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goals" 
ON public.user_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.user_goals FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON public.user_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
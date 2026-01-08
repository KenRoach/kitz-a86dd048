-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suggestion votes table
CREATE TABLE public.suggestion_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Suggestions policies: All authenticated users can view
CREATE POLICY "Anyone can view suggestions" 
ON public.suggestions 
FOR SELECT 
USING (true);

-- Users can insert their own suggestions
CREATE POLICY "Users can insert own suggestions" 
ON public.suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own suggestions
CREATE POLICY "Users can update own suggestions" 
ON public.suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own suggestions
CREATE POLICY "Users can delete own suggestions" 
ON public.suggestions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Votes policies: All authenticated users can view votes
CREATE POLICY "Anyone can view votes" 
ON public.suggestion_votes 
FOR SELECT 
USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can insert own votes" 
ON public.suggestion_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes" 
ON public.suggestion_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_suggestions_updated_at
BEFORE UPDATE ON public.suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
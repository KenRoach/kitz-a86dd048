-- Create suggestion comments table
CREATE TABLE public.suggestion_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggestion_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Anyone can view comments" 
ON public.suggestion_comments 
FOR SELECT 
USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments" 
ON public.suggestion_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
ON public.suggestion_comments 
FOR DELETE 
USING (auth.uid() = user_id);
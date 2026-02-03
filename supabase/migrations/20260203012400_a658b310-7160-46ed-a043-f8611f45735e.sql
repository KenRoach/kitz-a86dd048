-- Create knowledge base table for Customer Support Agent
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own knowledge base" 
ON public.knowledge_base FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create knowledge base entries" 
ON public.knowledge_base FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge base" 
ON public.knowledge_base FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge base" 
ON public.knowledge_base FOR DELETE USING (auth.uid() = user_id);

-- Add agent_type column to agent_rules for specialization
ALTER TABLE public.agent_rules ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT 'support';

-- Create trigger for updated_at
CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
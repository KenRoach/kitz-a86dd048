-- Create storefronts table
CREATE TABLE public.storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'shared', 'paid')),
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Enable RLS
ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;

-- Users can view their own storefronts
CREATE POLICY "Users can view own storefronts"
ON public.storefronts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own storefronts
CREATE POLICY "Users can insert own storefronts"
ON public.storefronts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own storefronts
CREATE POLICY "Users can update own storefronts"
ON public.storefronts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own storefronts
CREATE POLICY "Users can delete own storefronts"
ON public.storefronts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_storefronts_updated_at
BEFORE UPDATE ON public.storefronts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
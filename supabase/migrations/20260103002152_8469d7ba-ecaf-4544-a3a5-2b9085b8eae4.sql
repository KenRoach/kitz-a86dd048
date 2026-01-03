-- Create storefront_items table for bundle support
CREATE TABLE public.storefront_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storefront_id UUID NOT NULL REFERENCES public.storefronts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storefront_items ENABLE ROW LEVEL SECURITY;

-- Users can manage their own storefront items (via storefront ownership)
CREATE POLICY "Users can view own storefront items"
ON public.storefront_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.storefronts 
    WHERE storefronts.id = storefront_items.storefront_id 
    AND storefronts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own storefront items"
ON public.storefront_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.storefronts 
    WHERE storefronts.id = storefront_items.storefront_id 
    AND storefronts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own storefront items"
ON public.storefront_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.storefronts 
    WHERE storefronts.id = storefront_items.storefront_id 
    AND storefronts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own storefront items"
ON public.storefront_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.storefronts 
    WHERE storefronts.id = storefront_items.storefront_id 
    AND storefronts.user_id = auth.uid()
  )
);

-- Public can view items for sent/paid storefronts
CREATE POLICY "Public can view sent storefront items"
ON public.storefront_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.storefronts 
    WHERE storefronts.id = storefront_items.storefront_id 
    AND storefronts.status IN ('sent', 'paid')
  )
);

-- Add is_bundle flag to storefronts table
ALTER TABLE public.storefronts ADD COLUMN is_bundle BOOLEAN NOT NULL DEFAULT false;
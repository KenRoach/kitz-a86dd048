-- Add buyer info columns to storefronts
ALTER TABLE public.storefronts 
ADD COLUMN IF NOT EXISTS buyer_name text,
ADD COLUMN IF NOT EXISTS buyer_phone text,
ADD COLUMN IF NOT EXISTS buyer_email text,
ADD COLUMN IF NOT EXISTS buyer_note text,
ADD COLUMN IF NOT EXISTS ordered_at timestamp with time zone;

-- Allow public to update specific fields on sent storefronts (for buyer info)
CREATE POLICY "Public can update buyer info on sent storefronts"
ON public.storefronts
FOR UPDATE
USING (status = 'sent')
WITH CHECK (status = 'sent');
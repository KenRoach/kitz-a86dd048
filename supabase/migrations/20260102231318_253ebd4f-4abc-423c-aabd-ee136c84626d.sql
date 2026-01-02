-- Add seller_phone column to storefronts
ALTER TABLE public.storefronts 
ADD COLUMN seller_phone text;
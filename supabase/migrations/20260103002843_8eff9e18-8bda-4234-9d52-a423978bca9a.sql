-- Add order_key column to storefronts for unique transaction tracking
ALTER TABLE public.storefronts ADD COLUMN order_key TEXT;

-- Create function to generate short unique order keys
CREATE OR REPLACE FUNCTION public.generate_order_key()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_key := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate order_key on insert
CREATE TRIGGER set_order_key
  BEFORE INSERT ON public.storefronts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_key();

-- Backfill existing storefronts with order keys
UPDATE public.storefronts 
SET order_key = UPPER(SUBSTRING(MD5(id::TEXT || created_at::TEXT) FROM 1 FOR 8))
WHERE order_key IS NULL;
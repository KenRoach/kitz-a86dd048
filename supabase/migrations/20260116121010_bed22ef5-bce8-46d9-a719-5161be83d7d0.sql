-- Add version tracking columns to storefronts table
ALTER TABLE public.storefronts 
ADD COLUMN IF NOT EXISTS version_major INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS version_minor INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS version_patch INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS version_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create function to auto-increment version on changes
CREATE OR REPLACE FUNCTION public.increment_storefront_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Major version bump: payment methods changed
  IF OLD.payment_cards IS DISTINCT FROM NEW.payment_cards
     OR OLD.payment_yappy IS DISTINCT FROM NEW.payment_yappy
     OR OLD.payment_cash IS DISTINCT FROM NEW.payment_cash
     OR OLD.payment_pluxee IS DISTINCT FROM NEW.payment_pluxee THEN
    NEW.version_major := OLD.version_major + 1;
    NEW.version_minor := 0;
    NEW.version_patch := 0;
  -- Minor version bump: price or items changed
  ELSIF OLD.price IS DISTINCT FROM NEW.price
        OR OLD.is_bundle IS DISTINCT FROM NEW.is_bundle
        OR OLD.quantity IS DISTINCT FROM NEW.quantity THEN
    NEW.version_minor := OLD.version_minor + 1;
    NEW.version_patch := 0;
  -- Patch version bump: description, status, or other fields changed
  ELSIF OLD.title IS DISTINCT FROM NEW.title
        OR OLD.description IS DISTINCT FROM NEW.description
        OR OLD.status IS DISTINCT FROM NEW.status
        OR OLD.image_url IS DISTINCT FROM NEW.image_url
        OR OLD.customer_name IS DISTINCT FROM NEW.customer_name
        OR OLD.fulfillment_status IS DISTINCT FROM NEW.fulfillment_status THEN
    NEW.version_patch := OLD.version_patch + 1;
  END IF;
  
  -- Always update version timestamp when version changes
  IF NEW.version_major != OLD.version_major 
     OR NEW.version_minor != OLD.version_minor 
     OR NEW.version_patch != OLD.version_patch THEN
    NEW.version_updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-increment version
DROP TRIGGER IF EXISTS increment_storefront_version_trigger ON public.storefronts;
CREATE TRIGGER increment_storefront_version_trigger
  BEFORE UPDATE ON public.storefronts
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_storefront_version();

-- Update the public_storefronts view to include version info
DROP VIEW IF EXISTS public.public_storefronts;
CREATE VIEW public.public_storefronts AS
SELECT 
  id,
  title,
  description,
  price,
  quantity,
  status,
  image_url,
  customer_name,
  fulfillment_note,
  fulfillment_status,
  payment_cards,
  payment_yappy,
  payment_cash,
  payment_pluxee,
  ordered_at,
  is_bundle,
  user_id,
  mode,
  slug,
  valid_until,
  accepted_at,
  order_key,
  version_major,
  version_minor,
  version_patch,
  version_updated_at
FROM public.storefronts
WHERE status IN ('sent', 'paid') OR mode = 'quote';
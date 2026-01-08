-- Add mode column to storefronts for quote vs invoice distinction
ALTER TABLE public.storefronts 
ADD COLUMN mode text NOT NULL DEFAULT 'invoice';

-- Add quote-specific fields
ALTER TABLE public.storefronts 
ADD COLUMN valid_until timestamp with time zone,
ADD COLUMN accepted_at timestamp with time zone;

-- Update the public view to include new columns
DROP VIEW IF EXISTS public.public_storefronts;
CREATE VIEW public.public_storefronts AS
SELECT 
  id,
  user_id,
  title,
  description,
  price,
  quantity,
  image_url,
  status,
  slug,
  order_key,
  ordered_at,
  customer_name,
  fulfillment_note,
  is_bundle,
  payment_yappy,
  payment_cash,
  payment_cards,
  payment_pluxee,
  mode,
  valid_until,
  accepted_at
FROM storefronts
WHERE status IN ('sent', 'paid');

COMMENT ON COLUMN public.storefronts.mode IS 'Mode: invoice (direct payment) or quote (requires acceptance first)';
-- Add fulfillment_status column to storefronts
ALTER TABLE public.storefronts 
ADD COLUMN fulfillment_status TEXT NOT NULL DEFAULT 'pending';

-- Add paid_at timestamp for accurate payment tracking
ALTER TABLE public.storefronts 
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;

-- Add product_id to link storefronts to products
ALTER TABLE public.storefronts 
ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Update existing paid storefronts to have a fulfillment status
UPDATE public.storefronts 
SET fulfillment_status = 'complete' 
WHERE status = 'paid';

-- Update the public view to include new columns
DROP VIEW IF EXISTS public.public_storefronts;
CREATE VIEW public.public_storefronts 
WITH (security_invoker = true) AS
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
  accepted_at,
  fulfillment_status
FROM storefronts
WHERE status IN ('sent', 'paid');
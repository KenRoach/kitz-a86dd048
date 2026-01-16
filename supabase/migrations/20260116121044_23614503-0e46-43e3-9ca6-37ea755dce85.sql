-- Fix security definer view issue by using SECURITY INVOKER (default)
-- Drop and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_storefronts;
CREATE VIEW public.public_storefronts 
WITH (security_invoker = true)
AS
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
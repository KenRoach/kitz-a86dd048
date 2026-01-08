-- Fix: Recreate view with security_invoker = true to respect RLS of querying user
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
  accepted_at
FROM storefronts
WHERE status IN ('sent', 'paid');
-- Fix 1: Remove the dangerous public UPDATE policy on storefronts
-- The place-order Edge Function already handles buyer updates securely with service role
DROP POLICY IF EXISTS "Public can update buyer info on sent storefronts" ON public.storefronts;

-- Fix 2: Recreate public_profiles view with proper filtering
-- Only show profiles that are intentionally public (have username or have sent storefronts)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  business_name,
  business_type,
  city,
  country,
  website,
  instagram,
  username,
  logo_url,
  photo_url,
  storefront_image_url,
  payment_cards,
  payment_yappy,
  payment_cash,
  payment_pluxee,
  address
FROM profiles
WHERE username IS NOT NULL 
   OR user_id IN (SELECT user_id FROM storefronts WHERE status IN ('sent', 'paid'));

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;
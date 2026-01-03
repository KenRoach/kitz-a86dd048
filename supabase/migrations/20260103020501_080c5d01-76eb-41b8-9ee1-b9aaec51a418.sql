-- Recreate public_profiles view to allow access by user_id OR username
-- This fixes the issue where profiles without usernames couldn't be viewed
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
FROM profiles;

-- Grant access to anon and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;
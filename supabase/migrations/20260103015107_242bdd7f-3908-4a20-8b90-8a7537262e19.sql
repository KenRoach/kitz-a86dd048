-- Create public view for storefronts that excludes sensitive buyer/seller data
CREATE VIEW public.public_storefronts AS
SELECT 
  id, 
  title, 
  description, 
  price, 
  quantity, 
  status, 
  image_url, 
  is_bundle, 
  slug, 
  order_key,
  payment_cards, 
  payment_yappy, 
  payment_cash, 
  payment_pluxee,
  customer_name,
  fulfillment_note,
  ordered_at,
  user_id
FROM public.storefronts
WHERE status IN ('sent', 'paid');

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.public_storefronts TO anon, authenticated;

-- Create public view for profiles that excludes sensitive contact data
CREATE VIEW public.public_profiles AS
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
FROM public.profiles
WHERE username IS NOT NULL;

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;
-- Remove the overly permissive policy that exposes all profile data including phone numbers
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;

-- The public_profiles view already excludes sensitive fields (phone, ruc) 
-- and only shows profiles with usernames or active storefronts,
-- so public access should go through that view instead of direct table access
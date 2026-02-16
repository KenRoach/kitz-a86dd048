-- Fix: Remove public SELECT policy on storefronts that exposes buyer PII
-- Public access should go through the public_storefronts view which excludes PII fields
DROP POLICY IF EXISTS "Public can view sent storefronts" ON public.storefronts;
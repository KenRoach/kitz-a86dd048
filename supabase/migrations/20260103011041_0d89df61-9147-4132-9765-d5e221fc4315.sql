-- Add username column to profiles for custom profile URLs
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add RLS policy to allow public reading of profiles by username (for public profile pages)
CREATE POLICY "Public can view profiles by username"
ON public.profiles
FOR SELECT
USING (username IS NOT NULL);
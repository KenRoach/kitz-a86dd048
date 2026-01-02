-- Add instagram column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS instagram text;
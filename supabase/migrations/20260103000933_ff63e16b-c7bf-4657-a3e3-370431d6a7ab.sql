-- Drop the old check constraint and add the correct one
ALTER TABLE public.storefronts DROP CONSTRAINT IF EXISTS storefronts_status_check;

-- Add new constraint allowing draft, sent, paid
ALTER TABLE public.storefronts ADD CONSTRAINT storefronts_status_check CHECK (status IN ('draft', 'sent', 'paid'));
-- Add payment_proof_url column to storefronts table
ALTER TABLE public.storefronts 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
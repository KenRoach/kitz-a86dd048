-- Add new profile fields for admin settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS storefront_image_url text,
ADD COLUMN IF NOT EXISTS payment_cards boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_yappy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_cash boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_pluxee boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;
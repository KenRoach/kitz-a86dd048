-- Add payment method columns to storefronts
ALTER TABLE public.storefronts 
ADD COLUMN IF NOT EXISTS payment_cards boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_yappy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_cash boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_pluxee boolean DEFAULT false;
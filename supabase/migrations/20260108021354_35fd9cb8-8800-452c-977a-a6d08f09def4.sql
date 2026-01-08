-- Add product type column to distinguish products from services
ALTER TABLE public.products 
ADD COLUMN type text NOT NULL DEFAULT 'product';

-- Add comment for clarity
COMMENT ON COLUMN public.products.type IS 'Type of offering: product, service, or session';
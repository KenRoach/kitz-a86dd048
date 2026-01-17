-- Create barbershop_services table for services menu
CREATE TABLE public.barbershop_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create barbershop_gallery table for portfolio images
CREATE TABLE public.barbershop_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create barbershop_products table for recommended products
CREATE TABLE public.barbershop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  external_link TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.barbershop_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for barbershop_services
CREATE POLICY "Users can view their own services" ON public.barbershop_services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own services" ON public.barbershop_services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" ON public.barbershop_services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" ON public.barbershop_services
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view active services" ON public.barbershop_services
  FOR SELECT USING (is_active = true);

-- RLS Policies for barbershop_gallery
CREATE POLICY "Users can view their own gallery" ON public.barbershop_gallery
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gallery images" ON public.barbershop_gallery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery images" ON public.barbershop_gallery
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery images" ON public.barbershop_gallery
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view gallery" ON public.barbershop_gallery
  FOR SELECT USING (true);

-- RLS Policies for barbershop_products
CREATE POLICY "Users can view their own products" ON public.barbershop_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products" ON public.barbershop_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON public.barbershop_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON public.barbershop_products
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view active products" ON public.barbershop_products
  FOR SELECT USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_barbershop_services_updated_at
  BEFORE UPDATE ON public.barbershop_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_barbershop_products_updated_at
  BEFORE UPDATE ON public.barbershop_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
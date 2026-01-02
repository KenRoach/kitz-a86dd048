-- Add image_url and comment columns to storefronts
ALTER TABLE public.storefronts
ADD COLUMN image_url TEXT,
ADD COLUMN comment TEXT;

-- Create storage bucket for storefront images
INSERT INTO storage.buckets (id, name, public)
VALUES ('storefront-images', 'storefront-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload storefront images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'storefront-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to storefront images
CREATE POLICY "Public can view storefront images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'storefront-images');

-- Allow users to update their own images
CREATE POLICY "Users can update own storefront images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'storefront-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own storefront images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'storefront-images' AND auth.uid()::text = (storage.foldername(name))[1]);
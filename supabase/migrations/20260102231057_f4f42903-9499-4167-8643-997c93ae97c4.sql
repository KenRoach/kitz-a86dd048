-- Allow public (anonymous) read access to storefronts that are sent or paid
CREATE POLICY "Public can view sent storefronts"
ON public.storefronts
FOR SELECT
USING (status IN ('sent', 'paid'));
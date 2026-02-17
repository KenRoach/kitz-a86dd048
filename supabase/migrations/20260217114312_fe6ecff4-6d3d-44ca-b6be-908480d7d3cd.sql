
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Users can view suggestions" ON public.suggestions;

-- Replace with authenticated-only SELECT
CREATE POLICY "Authenticated users can view suggestions"
ON public.suggestions
FOR SELECT
USING (auth.uid() IS NOT NULL);

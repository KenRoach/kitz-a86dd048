-- Fix function search path for calculate_level
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(xp / 50)) + 1)::INTEGER;
END;
$$;
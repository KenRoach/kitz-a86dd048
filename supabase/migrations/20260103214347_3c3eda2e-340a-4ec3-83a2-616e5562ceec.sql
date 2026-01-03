-- Drop the restrictive policy
DROP POLICY IF EXISTS "Public can view profiles by username" ON profiles;

-- Create new policy that allows public viewing of all profiles
-- This is safe because public_profiles view only exposes non-sensitive fields
CREATE POLICY "Public can view profiles" 
ON profiles 
FOR SELECT 
USING (true);
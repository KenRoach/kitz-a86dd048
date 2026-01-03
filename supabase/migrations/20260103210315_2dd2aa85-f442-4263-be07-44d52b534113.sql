-- Create badge types enum
CREATE TYPE public.badge_category AS ENUM ('usage', 'growth', 'consistency', 'milestone');

-- Badges definition table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description TEXT NOT NULL,
  description_es TEXT NOT NULL,
  icon TEXT NOT NULL,
  category badge_category NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  points_required INTEGER NOT NULL DEFAULT 0,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User earned badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- User stats for tracking badge progress
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_storefronts INTEGER NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_products INTEGER NOT NULL DEFAULT 0,
  total_customers INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  profile_completeness INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Badges are readable by everyone
CREATE POLICY "Anyone can view badges"
ON public.badges FOR SELECT
USING (true);

-- User badges policies
CREATE POLICY "Users can view own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users badges"
ON public.user_badges FOR SELECT
USING (true);

-- User stats policies
CREATE POLICY "Users can view own stats"
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users stats"
ON public.user_stats FOR SELECT
USING (true);

CREATE POLICY "Users can insert own stats"
ON public.user_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
ON public.user_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Seed initial badges
INSERT INTO public.badges (name, name_es, description, description_es, icon, category, level, points_required, criteria) VALUES
-- Usage badges
('First Steps', 'Primeros Pasos', 'Created your first storefront', 'Creaste tu primera vitrina', 'rocket', 'usage', 1, 10, '{"storefronts": 1}'),
('Store Builder', 'Constructor de Tiendas', 'Created 5 storefronts', 'Creaste 5 vitrinas', 'store', 'usage', 2, 50, '{"storefronts": 5}'),
('Catalog Master', 'Maestro del Catálogo', 'Added 10 products', 'Agregaste 10 productos', 'package', 'usage', 2, 50, '{"products": 10}'),
('Product Pro', 'Profesional de Productos', 'Added 25 products', 'Agregaste 25 productos', 'boxes', 'usage', 3, 100, '{"products": 25}'),

-- Growth badges  
('First Sale', 'Primera Venta', 'Made your first sale', 'Hiciste tu primera venta', 'dollar-sign', 'growth', 1, 25, '{"orders": 1}'),
('Rising Star', 'Estrella Emergente', 'Completed 10 orders', 'Completaste 10 pedidos', 'trending-up', 'growth', 2, 75, '{"orders": 10}'),
('Sales Champion', 'Campeón de Ventas', 'Completed 50 orders', 'Completaste 50 pedidos', 'trophy', 'growth', 3, 150, '{"orders": 50}'),
('Revenue Milestone', 'Hito de Ingresos', 'Earned $500 in revenue', 'Ganaste $500 en ingresos', 'banknote', 'growth', 2, 100, '{"revenue": 500}'),
('Revenue Master', 'Maestro de Ingresos', 'Earned $2000 in revenue', 'Ganaste $2000 en ingresos', 'gem', 'growth', 3, 200, '{"revenue": 2000}'),

-- Consistency badges
('Daily Active', 'Activo Diario', 'Active for 3 consecutive days', 'Activo por 3 días consecutivos', 'flame', 'consistency', 1, 30, '{"streak": 3}'),
('Weekly Warrior', 'Guerrero Semanal', 'Active for 7 consecutive days', 'Activo por 7 días consecutivos', 'zap', 'consistency', 2, 70, '{"streak": 7}'),
('Monthly Master', 'Maestro Mensual', 'Active for 30 consecutive days', 'Activo por 30 días consecutivos', 'crown', 'consistency', 3, 200, '{"streak": 30}'),

-- Milestone badges
('Profile Complete', 'Perfil Completo', 'Completed your business profile', 'Completaste tu perfil de negocio', 'user-check', 'milestone', 1, 20, '{"profile": 100}'),
('Customer Collector', 'Colector de Clientes', 'Added 10 customers', 'Agregaste 10 clientes', 'users', 'milestone', 2, 60, '{"customers": 10}'),
('Network Builder', 'Constructor de Red', 'Added 50 customers', 'Agregaste 50 clientes', 'network', 'milestone', 3, 150, '{"customers": 50}');

-- Function to calculate user level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Level formula: each level requires more XP
  -- Level 1: 0-99, Level 2: 100-249, Level 3: 250-499, etc.
  RETURN GREATEST(1, FLOOR(SQRT(xp / 50)) + 1)::INTEGER;
END;
$$;

-- Trigger to update level when XP changes
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.level := calculate_level(NEW.xp);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_xp_change
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  WHEN (OLD.xp IS DISTINCT FROM NEW.xp)
  EXECUTE FUNCTION public.update_user_level();

-- Tighten agent caps: reduce daily_action_cap from 100 to 25
UPDATE public.agent_identities SET daily_action_cap = 25 WHERE daily_action_cap = 100;

-- Drop Eisenhower Tasks table
DROP TABLE IF EXISTS public.eisenhower_tasks;

-- Drop Habits table
DROP TABLE IF EXISTS public.habits;


-- AI Credits balance table (one row per user)
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 50,
  lifetime_used integer NOT NULL DEFAULT 0,
  last_recharged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.ai_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON public.ai_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON public.ai_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create credits row for new users via profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_credits (user_id, balance)
  VALUES (NEW.user_id, 50)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_add_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();

-- RPC to consume credits atomically (called from edge functions)
CREATE OR REPLACE FUNCTION public.consume_ai_credit(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE public.ai_credits
  SET balance = balance - p_amount,
      lifetime_used = lifetime_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING balance INTO new_balance;

  IF NOT FOUND THEN
    RETURN -1; -- insufficient credits
  END IF;

  RETURN new_balance;
END;
$$;

-- RPC to add credits (recharge)
CREATE OR REPLACE FUNCTION public.recharge_ai_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  INSERT INTO public.ai_credits (user_id, balance, last_recharged_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE
  SET balance = ai_credits.balance + p_amount,
      last_recharged_at = now(),
      updated_at = now()
  RETURNING balance INTO new_balance;

  RETURN new_balance;
END;
$$;

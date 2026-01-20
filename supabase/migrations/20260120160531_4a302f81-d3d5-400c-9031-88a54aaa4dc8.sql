-- =====================================================
-- CUSTOMER ENGAGEMENT & FEEDBACK PLATFORM
-- =====================================================

-- 1. NOTIFICATIONS TABLE
-- Stores all in-app notifications for users
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- 2. SURVEYS TABLE
-- Admin-created surveys
CREATE TABLE public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  survey_type text NOT NULL DEFAULT 'general',
  target_audience text DEFAULT 'all',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active surveys"
  ON public.surveys FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage surveys"
  ON public.surveys FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 3. SURVEY RESPONSES TABLE
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  nps_score integer CHECK (nps_score >= 0 AND nps_score <= 10),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own responses"
  ON public.survey_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
  ON public.survey_responses FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Index for analytics
CREATE INDEX idx_survey_responses_survey ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_nps ON public.survey_responses(nps_score) WHERE nps_score IS NOT NULL;

-- 4. CUSTOMER FEEDBACK TABLE
-- Star ratings and comments on orders/storefronts
CREATE TABLE public.customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id uuid REFERENCES public.storefronts(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL,
  buyer_name text,
  buyer_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public feedback"
  ON public.customer_feedback FOR SELECT
  USING (is_public = true);

CREATE POLICY "Sellers can view their feedback"
  ON public.customer_feedback FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Anyone can submit feedback"
  ON public.customer_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all feedback"
  ON public.customer_feedback FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Indexes for analytics
CREATE INDEX idx_feedback_seller ON public.customer_feedback(seller_id);
CREATE INDEX idx_feedback_rating ON public.customer_feedback(rating);

-- 5. NPS TRACKING VIEW
-- Aggregated NPS metrics for dashboard
CREATE OR REPLACE VIEW public.nps_metrics AS
SELECT 
  COUNT(*) FILTER (WHERE nps_score >= 9) as promoters,
  COUNT(*) FILTER (WHERE nps_score >= 7 AND nps_score <= 8) as passives,
  COUNT(*) FILTER (WHERE nps_score <= 6) as detractors,
  COUNT(*) as total_responses,
  ROUND(
    (COUNT(*) FILTER (WHERE nps_score >= 9)::numeric / NULLIF(COUNT(*), 0) * 100) -
    (COUNT(*) FILTER (WHERE nps_score <= 6)::numeric / NULLIF(COUNT(*), 0) * 100)
  , 1) as nps_score
FROM public.survey_responses
WHERE nps_score IS NOT NULL;

-- 6. FEEDBACK SUMMARY VIEW
CREATE OR REPLACE VIEW public.feedback_summary AS
SELECT 
  seller_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating)::numeric, 2) as avg_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star,
  COUNT(*) FILTER (WHERE rating = 4) as four_star,
  COUNT(*) FILTER (WHERE rating = 3) as three_star,
  COUNT(*) FILTER (WHERE rating = 2) as two_star,
  COUNT(*) FILTER (WHERE rating = 1) as one_star
FROM public.customer_feedback
GROUP BY seller_id;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
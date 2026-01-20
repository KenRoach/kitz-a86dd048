-- Fix security warnings

-- 1. Drop and recreate views with security_invoker
DROP VIEW IF EXISTS public.nps_metrics;
DROP VIEW IF EXISTS public.feedback_summary;

CREATE VIEW public.nps_metrics
WITH (security_invoker=on) AS
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

CREATE VIEW public.feedback_summary
WITH (security_invoker=on) AS
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
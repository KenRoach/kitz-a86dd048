-- Security fix: Restrict notifications INSERT to owner-only (edge functions use service-role bypass).
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Security fix: Restrict customer_feedback INSERT to verified purchases (storefront must be paid, one feedback per storefront).
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.customer_feedback;
CREATE POLICY "Customers can submit feedback for completed orders"
  ON public.customer_feedback FOR INSERT
  WITH CHECK (
    storefront_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.storefronts s
      WHERE s.id = customer_feedback.storefront_id
        AND s.user_id = customer_feedback.seller_id
        AND s.status = 'paid'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.customer_feedback cf
      WHERE cf.storefront_id = customer_feedback.storefront_id
    )
  );
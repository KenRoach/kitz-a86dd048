-- Performance indexes for 10k DAU scale
-- These indexes optimize the most common query patterns

-- Storefronts (most queried table)
CREATE INDEX IF NOT EXISTS idx_storefronts_user_id ON public.storefronts(user_id);
CREATE INDEX IF NOT EXISTS idx_storefronts_status ON public.storefronts(status);
CREATE INDEX IF NOT EXISTS idx_storefronts_created_at ON public.storefronts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storefronts_user_status ON public.storefronts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_storefronts_slug ON public.storefronts(slug);
CREATE INDEX IF NOT EXISTS idx_storefronts_ordered_at ON public.storefronts(ordered_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_storefronts_paid_at ON public.storefronts(paid_at DESC NULLS LAST);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_user_active ON public.products(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_lifecycle ON public.customers(lifecycle);
CREATE INDEX IF NOT EXISTS idx_customers_last_interaction ON public.customers(last_interaction DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Activity Log
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON public.activity_log(type);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON public.activity_log(user_id, created_at DESC);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- User Stats
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);

-- User Goals
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_period ON public.user_goals(period_start);

-- Storefront Items
CREATE INDEX IF NOT EXISTS idx_storefront_items_storefront_id ON public.storefront_items(storefront_id);

-- Suggestions (for Feature Requests page)
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public.suggestions(created_at DESC);

-- Suggestion Votes
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion_id ON public.suggestion_votes(suggestion_id);

-- Content Calendar
CREATE INDEX IF NOT EXISTS idx_content_calendar_user_id ON public.content_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled ON public.content_calendar(scheduled_date);

-- Eisenhower Tasks
CREATE INDEX IF NOT EXISTS idx_eisenhower_tasks_user_id ON public.eisenhower_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_eisenhower_tasks_quadrant ON public.eisenhower_tasks(quadrant);

-- Habits
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);

-- User Badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
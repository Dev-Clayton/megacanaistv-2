CREATE TABLE public.ai_recommendation_access_state (id text PRIMARY KEY, status integer NOT NULL, message text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.ai_recommendation_access_state TO service_role;
ALTER TABLE public.ai_recommendation_access_state ENABLE ROW LEVEL SECURITY;
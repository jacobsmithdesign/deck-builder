-- Deck engagement: views (denormalized count), likes (per-user), comments (per-user).
-- Optimized for fast reads: view_count on decks; indexed junction/comment tables.

-- 1) Views: denormalized count on decks for fast display; no per-user view table for now.
ALTER TABLE public.decks
ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Function to increment view_count in one round-trip (avoids read-then-write).
CREATE OR REPLACE FUNCTION public.increment_deck_view_count(deck_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.decks SET view_count = view_count + 1 WHERE id = deck_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_deck_view_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_deck_view_count(uuid) TO authenticated;

-- 2) Likes: one row per (deck, user). Composite PK + indexes for fast count and "user liked?" lookup.
CREATE TABLE IF NOT EXISTS public.deck_likes (
  deck_id uuid NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (deck_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_likes_deck_id ON public.deck_likes(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_likes_user_id ON public.deck_likes(user_id);

-- 3) Comments: one row per comment; indexed by deck_id (list by deck) and user_id (analytics).
CREATE TABLE IF NOT EXISTS public.deck_comments (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deck_comments_deck_id ON public.deck_comments(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_comments_user_id ON public.deck_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_comments_created_at ON public.deck_comments(deck_id, created_at DESC);

-- RLS: deck_likes
ALTER TABLE public.deck_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read deck likes"
ON public.deck_likes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can insert own like"
ON public.deck_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own like"
ON public.deck_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS: deck_comments
ALTER TABLE public.deck_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read deck comments"
ON public.deck_comments FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can insert own comment"
ON public.deck_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comment"
ON public.deck_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment"
ON public.deck_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

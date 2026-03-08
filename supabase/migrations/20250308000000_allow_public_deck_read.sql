-- Allow reading decks when:
-- 1. Deck is public (is_public = true), or
-- 2. Deck is official/precon (user_id IS NULL), or
-- 3. Current user owns the deck (user_id = auth.uid())
-- This lets logged-out users (anon) read public and official decks;
-- logged-in users can also read their own private decks.

CREATE POLICY "Allow read public and own decks"
ON public.decks
FOR SELECT
TO anon, authenticated
USING (
  is_public = true
  OR user_id IS NULL
  OR user_id = auth.uid()
);

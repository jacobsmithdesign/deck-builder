-- Index for faster deck name search (ILIKE / text search).
-- Use btree for equality and prefix; use pg_trgm GIN for contains/substring search.

-- Standard btree: helps equality, sort by name, and prefix filters.
CREATE INDEX IF NOT EXISTS idx_decks_name ON public.decks (name);

-- Optional: trigram index for fast ILIKE '%...%' (substring) search.
-- Enables index use for queries like: WHERE name ILIKE '%eldrazi%'
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_decks_name_gin_trgm ON public.decks USING gin (name gin_trgm_ops);

-- RPC to search commander decks by name/set/commander without PostgREST filter parsing issues.
-- Returns ordered deck ids and total count; app fetches full rows by id.

CREATE OR REPLACE FUNCTION public.search_commander_decks(
  p_search text,
  p_include_user_decks boolean DEFAULT false,
  p_offset int DEFAULT 0,
  p_limit int DEFAULT 30
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH matching AS (
    SELECT d.id
    FROM decks d
    LEFT JOIN cards c ON c.uuid = d.commander_uuid
    LEFT JOIN sets s ON s.code = d.code
    WHERE d.type = 'Commander Deck'
      AND (d.user_id IS NULL OR p_include_user_decks)
      AND (
        p_search IS NULL
        OR trim(p_search) = ''
        OR d.name ILIKE '%' || trim(p_search) || '%'
        OR c.name ILIKE '%' || trim(p_search) || '%'
        OR s.name ILIKE '%' || trim(p_search) || '%'
      )
  ),
  ordered AS (
    SELECT m.id
    FROM matching m
    JOIN decks d ON d.id = m.id
    ORDER BY d.release_date DESC NULLS LAST, d.id
    LIMIT greatest(nullif(p_limit, 0), 1)
    OFFSET greatest(p_offset, 0)
  ),
  total AS (
    SELECT count(*) AS n FROM matching
  )
  SELECT json_build_object(
    'deck_ids', (SELECT coalesce(array_agg(id), '{}') FROM ordered),
    'total_count', (SELECT n FROM total)
  );
$$;

GRANT EXECUTE ON FUNCTION public.search_commander_decks TO anon, authenticated;

COMMENT ON FUNCTION public.search_commander_decks IS 'Returns { deck_ids: uuid[], total_count: number } for commander deck search; avoids PostgREST filter parsing for search text with spaces.';

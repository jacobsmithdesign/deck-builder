import type { CardRecord } from "@/lib/schemas";

type RawMatchCard = {
  uuid: string;
  name?: string | null;
  type?: string | null;
  text?: string | null;
  identifiers?: Record<string, string> | null;
  color_identity?: string[] | null;
  [key: string]: unknown;
};

function scryfallIdToImageUrl(scryfallId: string): string {
  return `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`;
}

/**
 * Normalize a row from match_cards RPC into a CardRecord-like object with imageFrontUrl.
 */
export function normalizeSearchCard(row: RawMatchCard): CardRecord & { imageFrontUrl: string | null } {
  const identifiers = row.identifiers ?? null;
  const scryfallId = identifiers?.scryfallId ?? null;
  return {
    uuid: row.uuid,
    name: row.name ?? null,
    type: row.type ?? null,
    text: row.text ?? "",
    identifiers,
    color_identity: row.color_identity ?? null,
    count: 1,
    mana_cost: row.mana_cost ?? null,
    mana_value: row.mana_value ?? null,
    converted_mana_cost: row.converted_mana_cost ?? null,
    power: row.power ?? null,
    toughness: row.toughness ?? null,
    loyalty: row.loyalty ?? null,
    life: row.life ?? null,
    defense: row.defense ?? null,
    layout: row.layout ?? null,
    rarity: row.rarity ?? null,
    types: row.types ?? null,
    frame_version: row.frame_version ?? null,
    finishes: row.finishes ?? null,
    flavor_text: row.flavor_text ?? null,
    flavor_name: row.flavor_name ?? null,
    is_reprint: row.is_reprint ?? null,
    is_online_only: row.is_online_only ?? null,
    keywords: row.keywords ?? null,
    original_printings: row.original_printings ?? null,
    other_face_ids: row.other_face_ids ?? null,
    variations: row.variations ?? null,
    side: row.side ?? null,
    artist: row.artist ?? null,
    artist_ids: row.artist_ids ?? null,
    edhrec_rank: row.edhrec_rank ?? null,
    edhrec_saltiness: row.edhrec_saltiness ?? null,
    purchase_urls: row.purchase_urls ?? null,
    imageFrontUrl: scryfallId ? scryfallIdToImageUrl(scryfallId) : null,
  } as CardRecord & { imageFrontUrl: string | null };
}

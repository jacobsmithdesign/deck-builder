import type { CardRecord } from "@/lib/schemas";
import type { DeckMetadata } from "@/app/context/CardListContext";

type GetDeckByIdCard = {
  uuid: string;
  name: string | null;
  type: string | null;
  mana_cost: string | null;
  color_identity: string[] | null;
  converted_mana_cost?: number;
  text?: string;
  flavourText?: string;
  rarity?: string;
  count: number;
  board_section: string;
  imageFrontUrl?: string | null;
  imageBackUrl?: string | null;
  identifiers?: Record<string, string> | null;
  keywords?: string[] | null;
};

type GetDeckByIdDeck = {
  id: string;
  name: string;
  user_id: string | null;
  type: string;
  release_date: string | null;
  code: string | null;
  sealed_product: string | null;
  is_public: boolean;
  description: string | null;
  creatorName: string | null;
  display_card_uuid: string | null;
  commander_uuid: string | null;
  tags: string[];
  cards: GetDeckByIdCard[];
};

type GetDeckByIdResponse = {
  source: string;
  deck: GetDeckByIdDeck;
};

function mapCardToRecord(c: GetDeckByIdCard): CardRecord & { imageFrontUrl?: string | null } {
  return {
    uuid: c.uuid,
    name: c.name ?? "",
    type: c.type ?? "",
    text: c.text ?? "",
    mana_cost: c.mana_cost ?? undefined,
    mana_value: c.converted_mana_cost ?? undefined,
    converted_mana_cost: c.converted_mana_cost ?? undefined,
    color_identity: c.color_identity ?? undefined,
    count: c.count ?? 1,
    identifiers: c.identifiers ?? undefined,
    flavor_text: c.flavourText ?? undefined,
    keywords: c.keywords ?? undefined,
    rarity: c.rarity ?? undefined,
    imageFrontUrl: c.imageFrontUrl ?? undefined,
  } as CardRecord & { imageFrontUrl?: string | null };
}

function mapDeckToMetadata(d: GetDeckByIdDeck): DeckMetadata {
  return {
    id: d.id,
    name: d.name,
    userId: d.user_id,
    type: d.type,
    isUserDeck: !!d.user_id,
    isPublic: d.is_public,
    code: d.code ?? null,
    release_date: d.release_date ?? null,
    sealed_product: d.sealed_product ?? null,
    commander_uuid: d.commander_uuid ?? null,
    display_card_uuid: d.display_card_uuid ?? null,
    tags: d.tags ?? [],
    creatorName: d.creatorName ?? null,
    description: d.description ?? null,
  };
}

export async function fetchDeckForComparison(deckId: string): Promise<{
  deck: DeckMetadata;
  cards: CardRecord[];
}> {
  const res = await fetch(`/api/decks/${encodeURIComponent(deckId)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data.error as string) || "Failed to load deck");
  }
  const data: GetDeckByIdResponse = await res.json();
  const d = data.deck;
  const cards: CardRecord[] = (d.cards ?? [])
    .filter((c) => (c.board_section || "mainboard").toLowerCase() === "mainboard")
    .map(mapCardToRecord);
  return {
    deck: mapDeckToMetadata(d),
    cards,
  };
}

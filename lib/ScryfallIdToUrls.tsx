type ScryfallUrls = [string, string, string];

export function scryfallIdToUrls(
  scryfallId: string,
  scryfallCardBackId?: string | null
): ScryfallUrls {
  // Helper to break ID into path segments
  const idToPath = (id: string) => `${id[0]}/${id[1]}/${id}`;

  const frontUrl = `https://cards.scryfall.io/normal/front/${idToPath(
    scryfallId
  )}.jpg`;

  const backUrl = scryfallCardBackId
    ? `https://cards.scryfall.io/normal/front/${idToPath(
        scryfallCardBackId
      )}.jpg`
    : null;

  const artworkUrl = `https://cards.scryfall.io/art_crop/front/${idToPath(
    scryfallId
  )}.jpg`;

  return [frontUrl, backUrl, artworkUrl];
}

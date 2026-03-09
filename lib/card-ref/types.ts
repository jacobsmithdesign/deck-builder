/**
 * Minimal card data needed for inline link display and hover preview.
 * Resolved before render so hover does not trigger DB lookups.
 */
export type CardPreview = {
  uuid: string;
  name: string;
  imageFrontUrl: string | null;
};

// landCompression.ts
// Purpose: compress lands into (1) mana_pool and (2) signal land shortlist.

export type CardLite = {
  name: string | null;
  mana_value: number | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
  color_identity?: string[] | null;
};

export type DeckLite = {
  id: string;
  commander: CardLite | null;
  deck_cards: { count: number; board_section: string; card: CardLite }[];
};

const COLORS = ["W", "U", "B", "R", "G"] as const;
type Color = (typeof COLORS)[number];
type ColorCounts = Record<Color, number>;

function emptyColorCounts(): ColorCounts {
  return { W: 0, U: 0, B: 0, R: 0, G: 0 };
}

// ───────────────────────────────────────────────────────────────────────────────
// Mana detection (reuses ideas from your feature builder)
// ───────────────────────────────────────────────────────────────────────────────
const ANY_COLOR = /\{T\}:\s*Add (?:one )?mana of any color/i;
const PRODUCES_C = /\{T\}:\s*Add\s*\{C\}/i;

function landSourcesFromText(
  text: string | null | undefined,
  commanderColors?: string[] | null
): ColorCounts {
  const out = emptyColorCounts();
  if (!text) return out;

  if (ANY_COLOR.test(text)) {
    const targets: Color[] = (
      commanderColors?.length ? commanderColors : COLORS
    ) as Color[];
    for (const c of targets) out[c] += 1;
  }

  const matches = text.match(/\{[WUBRG]\}/g) ?? [];
  for (const m of matches) {
    const c = m.slice(1, -1) as Color;
    out[c] += 1;
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────────────
// Land context detection (to treat fetches/etc. as signal in land-matter decks)
// ───────────────────────────────────────────────────────────────────────────────
const RX_LAND_CONTEXT = {
  landfall: /\blandfall\b/i,
  extraLandDrops: /(you may play|play) an additional land/i,
  crucibleLoop:
    /(play lands? from your graveyard|you may play lands? from your graveyard|crucible)/i,
  landTutors: /search your library.*\bland\b/i,
  landETBMatters: /(whenever a land enters the battlefield|lands you control)/i,
  tokensFromLands: /(create .* token).*(whenever a land)/i,
};

function computeLandContextScore(deck: DeckLite): number {
  const nonlands = deck.deck_cards.filter(
    (dc) =>
      dc.board_section === "mainboard" && !(dc.card.type || "").includes("Land")
  );

  let score = 0;
  for (const { card, count } of nonlands) {
    const t = card.text || "";
    for (const [k, re] of Object.entries(RX_LAND_CONTEXT)) {
      if (re.test(t)) {
        // weight slightly, with diminishing returns via sqrt-like behavior
        score += Math.min(3, 1 * Math.log2(1 + count + 1)); // ~1.6 max per feature per card group
      }
    }
  }
  return Number(score.toFixed(2)); // ~0..(small number). Thresholds below use this.
}

// ───────────────────────────────────────────────────────────────────────────────
// Signal-land tagging
// ───────────────────────────────────────────────────────────────────────────────
const RX_SIGNAL_LAND = {
  // Card advantage & selection
  draw: /(draw a card|scry \d+)/i,
  repeatDraw: /(activate.*draw a card|you may pay.*if you do, draw a card)/i,
  // Tutoring/fixing
  landTutor: /search your library.*\bland\b/i, // Krosan Verge, Myriad Landscape
  fetchSelfSack:
    /(sacrifice .*?: )?search your library.* (basic|plains|forest|island|swamp|mountain|gate)/i, // Evolving Wilds, Fabled Passage
  // Engine/protection/lock pieces
  graveHate:
    /(exile.*graveyard|exile all cards from target player's graveyard)/i, // Bojuka Bog, Scavenger Grounds
  recursionTop:
    /(put target (?:enchantment|card) from your graveyard on top of your library|return target land)/i, // Hall of Heliod’s Generosity / Mistveil Plains class
  recursionBattlefield:
    /(return target .* from your graveyard to the battlefield)/i,
  manland: /(becomes? a .* creature|until end of turn, this land is)/i,
  tokenEngine: /(create .* token).*(activate|pay|tap|whenever)/i, // Field of the Dead will match via "create" + condition
  blinkProtect: /(phase out|flicker|exile target .* then return)/i,
  antiCounter:
    /(spells you cast.*can't be countered|add one mana.*of any color\. spend this mana only to cast creature spells)/i, // Cavern of Souls (approx)
  evasion: /(target creature can't be blocked|gives flying|menace|trample)/i, // Rogue's Passage class
  colorShift:
    /(lands? (?:you control )?are|is) (every|each) basic land type|are also every basic land type|becomes? every basic land type|are forests|are swamps|are plains|are islands|are mountains/i, // Urborg/Yavimaya/Prismatic Omen-like
  devotionBurst:
    /(add \{[WUBRG]\} for each (?:permanent|creature|enchantment))/i, // Nykthos / Sanctum-like
  untapEngine: /(untap) (target|all) lands/i, // Nykthos + untap enablers, Deserted Temple, etc.
  damageRemoval: /(deals? \d+ damage to|destroy target .* if)/i,
  commanderSupport:
    /(put your commander into your hand from the command zone|commander tax)/i, // Command Beacon-ish
  handSize: /(no maximum hand size|maximum hand size)/i, // Reliquary Tower
  boardBounce: /(return .* to (?:its|their) owners' hand)/i,
};

const RX_NON_SIGNAL_FAST = {
  // Common ETBs that shouldn't elevate a land to "signal" on their own
  etbTapped: /enters the battlefield tapped/i,
  lifeGain1: /you gain 1 life/i,
  scry1ETB: /scry 1/i,
};

type LandTag =
  | "draw"
  | "repeatDraw"
  | "landTutor"
  | "fetchSelfSack"
  | "graveHate"
  | "recursionTop"
  | "recursionBattlefield"
  | "manland"
  | "tokenEngine"
  | "blinkProtect"
  | "antiCounter"
  | "evasion"
  | "colorShift"
  | "devotionBurst"
  | "untapEngine"
  | "damageRemoval"
  | "commanderSupport"
  | "handSize"
  | "boardBounce";

/**
 * Score a land's significance.
 * - Base on detected tags (positive weights).
 * - Penalize trivial ETB (tapped/scry1/1 life) when no other tags.
 * - Elevate fetches only if land-context score is high (landfall/extra drops/etc.).
 */
function scoreSignalLand(
  name: string,
  typeLine: string,
  text: string,
  count: number,
  landContextScore: number
) {
  const tags: LandTag[] = [];
  for (const [k, re] of Object.entries(RX_SIGNAL_LAND)) {
    if (re.test(text)) tags.push(k as LandTag);
  }

  // Heuristics for name-based heavy hitters (short-circuit boost)
  const NAME = name.toLowerCase();
  if (
    /gaea'?s cradle|serra'?s sanctum|nykthos|field of the dead|urza'?s saga|cabal coffers/.test(
      NAME
    )
  ) {
    if (!tags.includes("devotionBurst")) tags.push("devotionBurst");
    if (/field of the dead/.test(NAME) && !tags.includes("tokenEngine"))
      tags.push("tokenEngine");
  }
  if (
    /yavimaya, cradle of growth|urborg, tomb of yawgmoth|dryad of the ilysian grove/.test(
      NAME
    )
  ) {
    if (!tags.includes("colorShift")) tags.push("colorShift");
  }
  if (/reliquary tower|war room|bonder'?s enclave|horizon canopy/.test(NAME)) {
    if (!tags.includes("draw")) tags.push("draw");
  }
  if (/cavern of souls/.test(NAME)) {
    if (!tags.includes("antiCounter")) tags.push("antiCounter");
  }
  if (/command beacon/.test(NAME)) {
    if (!tags.includes("commanderSupport")) tags.push("commanderSupport");
  }
  if (/bojuka bog|scavenger grounds/.test(NAME)) {
    if (!tags.includes("graveHate")) tags.push("graveHate");
  }
  if (/mistveil plains|hall of heliod/.test(NAME)) {
    if (!tags.includes("recursionTop")) tags.push("recursionTop");
  }
  if (/rogue'?s passage/.test(NAME)) {
    if (!tags.includes("evasion")) tags.push("evasion");
  }
  if (
    /krosan verge|myriad landscape|blighted woodland|thawing glaciers/.test(
      NAME
    )
  ) {
    if (!tags.includes("landTutor")) tags.push("landTutor");
  }

  // Weights (explainable, additive with diminishing returns)
  const baseWeights: Record<LandTag, number> = {
    draw: 3.0,
    repeatDraw: 3.5,
    landTutor: 3.2,
    fetchSelfSack: 1.4, // light unless land-context ups it
    graveHate: 3.0,
    recursionTop: 3.2,
    recursionBattlefield: 3.6,
    manland: 2.8,
    tokenEngine: 3.8,
    blinkProtect: 2.4,
    antiCounter: 2.8,
    evasion: 2.5,
    colorShift: 3.2,
    devotionBurst: 4.0,
    untapEngine: 2.6,
    damageRemoval: 2.2,
    commanderSupport: 2.2,
    handSize: 2.0,
    boardBounce: 2.2,
  };

  // Sum with diminishing returns per tag variety, not count
  let score =
    tags.reduce((acc, t) => acc + (baseWeights[t] ?? 0), 0) *
    (1 + Math.log1p(Math.min(count, 4)) * 0.35); // stacks slightly for multiples

  // Fetches get upgraded if land-matter context is present
  if (tags.includes("fetchSelfSack")) {
    score += Math.min(2.2, 0.9 * landContextScore);
  }

  // De-emphasize trivial lands if they ONLY do trivial things
  if (tags.length === 0) {
    if (RX_NON_SIGNAL_FAST.etbTapped.test(text)) score -= 0.6;
    if (RX_NON_SIGNAL_FAST.scry1ETB.test(text)) score -= 0.5;
    if (RX_NON_SIGNAL_FAST.lifeGain1.test(text)) score -= 0.4;
  }

  // If literally no signal, clamp to 0
  if (score < 0.6) score = 0;

  // Return
  return {
    score: Number(score.toFixed(2)),
    tags: Array.from(new Set(tags)) as LandTag[],
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
export function compressLands(deck: DeckLite): {
  mana_pool: ColorCounts;
  signal_lands: Array<{
    name: string;
    count: number;
    tags: LandTag[];
    why: string;
  }>;
} {
  const commanderColors: string[] =
    (deck.commander?.color_identity as string[] | undefined) ?? [];

  const main = deck.deck_cards.filter((dc) => dc.board_section === "mainboard");
  const lands = main.filter((dc) => (dc.card.type || "").includes("Land"));

  // 1) Mana pool aggregation (colored sources only; you can add {C} if you track it)
  const mana_pool = emptyColorCounts();
  for (const { card, count } of lands) {
    const per = landSourcesFromText(card.text, commanderColors);
    for (const c of COLORS) mana_pool[c] += per[c] * count;
  }

  // 2) Signal lands (scored + filtered)
  const landContextScore = computeLandContextScore(deck); // drives fetch/land-matter elevation
  const scored = lands.map(({ card, count }) => {
    const name = card.name ?? "Land";
    const typeLine = card.type ?? "";
    const text = card.text ?? "";
    const { score, tags } = scoreSignalLand(
      name,
      typeLine,
      text,
      count,
      landContextScore
    );
    return { name, count, score, tags, text };
  });

  // Keep only meaningful signals
  // - baseline threshold 2.6 (one substantial tag), lower to 2.0 if land context is strong
  const threshold = landContextScore >= 3 ? 2.0 : 2.6;

  // collapse duplicates by name (just in case input contains splits/variants)
  const byName = new Map<
    string,
    {
      name: string;
      count: number;
      score: number;
      tags: LandTag[];
      text: string;
    }
  >();
  for (const s of scored) {
    const prev = byName.get(s.name);
    if (!prev) byName.set(s.name, s);
    else
      byName.set(s.name, {
        ...s,
        count: prev.count + s.count,
        score: Math.max(prev.score, s.score),
        tags: Array.from(new Set([...prev.tags, ...s.tags])) as LandTag[],
      });
  }

  const shortlisted = Array.from(byName.values())
    .filter((s) => s.score >= threshold)
    // Deduplicate common non-signal lands that might slip through (e.g., basic dual variants)
    .filter((s) => s.tags.length > 0)
    .sort((a, b) => b.score - a.score);

  // Optional: cap to top N to avoid clutter, but show all with high scores
  const TOP_HARD_CAP = 12;
  const signal_lands_raw = shortlisted.slice(0, TOP_HARD_CAP);

  // Human-friendly “why” string (small, derived from tags)
  const TAG_LABEL: Record<LandTag, string> = {
    draw: "card draw",
    repeatDraw: "repeatable draw",
    landTutor: "land tutor/ramp",
    fetchSelfSack: "fetch/fix (synergy)",
    graveHate: "graveyard hate",
    recursionTop: "recursion to top",
    recursionBattlefield: "recursion to battlefield",
    manland: "becomes a creature",
    tokenEngine: "token engine",
    blinkProtect: "protect/blink",
    antiCounter: "anti-counter",
    evasion: "evasion enabler",
    colorShift: "color-type shift",
    devotionBurst: "explosive mana",
    untapEngine: "untap synergy",
    damageRemoval: "damage/removal",
    commanderSupport: "commander support",
    handSize: "hand size modifier",
    boardBounce: "bounce control",
  };

  const signal_lands = signal_lands_raw.map((s) => ({
    name: s.name,
    count: s.count,
    tags: s.tags,
    why: s.tags.map((t) => TAG_LABEL[t]).join(", "),
  }));

  return { mana_pool, signal_lands };
}

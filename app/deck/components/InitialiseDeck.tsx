"use client";

import { useEffect } from "react";
import { useCardList } from "@/app/context/CardListContext";
import { DeckRecord, CardRecord } from "@/lib/schemas";
import { CommanderCard } from "@/app/context/CommanderContext";
import {
  CommanderDeckDetails,
  useCommander,
} from "@/app/context/CommanderContext";
import { getAverageColorFromImage } from "@/lib/getAverageColour";

type DeckWithCards = DeckRecord & {
  cards: (CardRecord & { count: number; board_section: string })[];
};

// This component initialises the card list and deck details upon first visiting a deck page.
// It validates the card data and sets it in the useCardList context.
// It also sets the data for the commander overview section above the card table.
export default function InitialiseDeck({ deck }: { deck: DeckWithCards }) {
  const { setCards, setDeck } = useCardList();
  const { setDeckDetails, setCommanderCard } = useCommander();

  // console.log(
  //   "Cards initialised: ",
  //   deck.cards.map((c) => ({
  //     name: c.name,
  //     id: c.uuid,
  //     scryfallId: c.identifiers?.scryfallId,
  //   }))
  // );

  useEffect(() => {
    // Initialise the commander details overview. This gets sloppy around the image section but whatever.
    const commanderDeckDetails: CommanderDeckDetails = {
      id: deck.id,
      name: deck.name,
      userId: "user_id" in deck ? deck.user_id : null,
      type: deck.type,
      isUserDeck: "user_id" in deck,
      cards: deck.cards.map((c) => ({
        id: c.uuid,
        name: c.name,
        type: c.type,
        mana_cost: c.mana_cost,
        colorIdentity: c.color_identity ?? [],
        cmc: c.mana_value ?? 0,
        text: c.text ?? "",
        flavourText: c.flavor_text ?? null,
        board_section: c.board_section ?? "mainboard",
        count: c.count ?? 1,
        imageFrontUrl: c.identifiers.scryfallId
          ? `https://cards.scryfall.io/normal/front/${c.identifiers.scryfallId[0]}/${c.identifiers.scryfallId[1]}/${c.identifiers.scryfallId}.jpg`
          : null,
        imageBackUrl: c.identifiers.scryfallCardBackId
          ? `https://cards.scryfall.io/normal/back/${c.identifiers.scryfallCardBackId[0]}/${c.identifiers.scryfallCardBackId[1]}/${c.identifiers.scryfallCardBackId}.jpg`
          : null,
        artwork: c.identifiers.scryfallCardBackId
          ? `https://cards.scryfall.io/art_crop/front/${c.identifiers.scryfallId[0]}/${c.identifiers.scryfallId[1]}/${c.identifiers.scryfallId}.jpg`
          : null,
        identifiers: c.identifiers,
      })),
    };
    setDeckDetails(commanderDeckDetails);
    // Initialise the Commander card info
    const commanderCardRecord = deck.cards.find(
      (card) => card.uuid === deck.commander_uuid
    );

    console.log("commanderCardRecord: ", commanderCardRecord);
    const commanderCard: CommanderCard = {
      id: commanderCardRecord.uuid ?? crypto.randomUUID(),
      name: commanderCardRecord.name,
      type: commanderCardRecord.type,
      mana_cost: commanderCardRecord.mana_cost,
      colorIdentity: commanderCardRecord.color_identity,
      cmc: commanderCardRecord.mana_value,
      text: commanderCardRecord.text,
      imageFrontUrl: `https://cards.scryfall.io/normal/front/${commanderCardRecord.identifiers.scryfallId[0]}/${commanderCardRecord.identifiers.scryfallId[1]}/${commanderCardRecord.identifiers.scryfallId}.jpg`,

      imageBackUrl: `https://cards.scryfall.io/normal/front/${commanderCardRecord.identifiers.scryfallCardBackId[0]}/${commanderCardRecord.identifiers.scryfallCardBackId[1]}/${commanderCardRecord.identifiers.scryfallCardBackId}.jpg`,
      artwork: `https://cards.scryfall.io/art_crop/front/${commanderCardRecord.identifiers.scryfallId[0]}/${commanderCardRecord.identifiers.scryfallId[1]}/${commanderCardRecord.identifiers.scryfallId}.jpg`,
      isDoubleFaced: !!commanderCardRecord.identifiers?.scryfallCardBackId,
      identifiers: commanderCardRecord.identifiers,
    };
    setCommanderCard(commanderCard);

    // Initialise the cards to be displayed in the deck table
    const validatedCards = deck.cards.map((c) => {
      const scryfallId = c.identifiers.scryfallId;
      const scryfallBackId = c.identifiers?.scryfallCardBackId ?? null;

      return {
        id: c.uuid,
        name: c.name,
        type: c.type,
        mana_cost: c.mana_cost,
        colorIdentity: c.color_identity,
        power: c.power,
        toughness: c.toughness,
        loyalty: c.loyalty,
        keywords: c.keywords,
        variations: c.variations,
        edhrec_rank: c.edhrec_rank,
        edhrec_saltiness: c.edhrec_saltiness,
        purchase_urls: c.purchase_urls,
        cmc: c.converted_mana_cost,
        text: c.text,
        flavourText: c.flavor_text,
        board_section: c.board_section,
        imageFrontUrl: scryfallId
          ? `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`
          : null,
        imageBackUrl: scryfallBackId
          ? `https://cards.scryfall.io/normal/back/${scryfallBackId[0]}/${scryfallBackId[1]}/${scryfallBackId}.jpg`
          : null,
        isDoubleFaced: !!scryfallBackId,
        identifiers: c.identifiers ?? {},
        count: c.count ?? 1,
      };
    });

    setCards(validatedCards);
    setDeck({
      id: deck.id,
      name: deck.name,
      userId: "user_id" in deck ? deck.user_id : null,
      type: deck.type,
      isUserDeck: "user_id" in deck,
    });
  }, []);

  return null;
}

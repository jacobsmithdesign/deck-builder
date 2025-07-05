"use client";
import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Deck, UserDeck } from "@/lib/schemas";
import Image from "next/image";
import {
  BoardContent,
  Group,
  GroupHeader,
  GroupItems,
  GroupTitle,
} from "./Board";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { RxCross2 } from "react-icons/rx";
import { useUser } from "@/app/context/userContext";
import { supabase } from "@/lib/supabaseClient";

const groupByCardType = (cards: any[]) => {
  const typeOrder = [
    "Land",
    "Creature",
    "Enchantment",
    "Artifact",
    "Instant",
    "Sorcery",
    "Planeswalker",
    "Other",
  ];
  const grouped: Record<string, any[]> = {};

  for (const card of cards) {
    const baseType =
      typeOrder.find((type) =>
        card.type?.toLowerCase().includes(type.toLowerCase())
      ) || "Other";

    if (!grouped[baseType]) {
      grouped[baseType] = [];
    }
    grouped[baseType].push(card);
  }

  // Convert to array of { type, cards } for display
  return typeOrder
    .map((type) => ({ type, cards: grouped[type] }))
    .filter((group) => group.cards && group.cards.length > 0);
};

export const EditBoard = ({ deck }: { deck: Deck | UserDeck }) => {
  const { profile } = useUser();
  // state to determine deck ownership and render "edit" / "add to collection" buttons appropriately
  const isUserDeck = "user_id" in deck; // or deck.table === 'user_decks'
  const isOwner = isUserDeck && deck.user_id === profile.id;

  //   state to manage modal visibility and group visibility
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
  // State to manage cards being edited
  const [editableCards, setEditableCards] = useState(deck.cards);
  const groupedCardsArray = groupByCardType(editableCards);

  // Function to toggle visibility of a group
  const toggleGroupVisibility = (type: string) => {
    setVisibleGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const removeCard = (cardId: string, board_section: string) => {
    setEditableCards((prev) =>
      prev.filter(
        (card) => !(card.id === cardId && card.board_section === board_section)
      )
    );
  };

  const handleSave = async () => {
    if (!isUserDeck || !isOwner) return;

    // Step 1: delete all cards for this user_deck
    await supabase.from("user_deck_cards").delete().eq("user_deck_id", deck.id);

    // Step 2: reinsert current cards
    const newCardData = editableCards.map((card) => ({
      user_deck_id: deck.id,
      card_uuid: card.id,
      name: card.name,
      type: card.type,
      count: card.count,
      mana_cost: card.manaCost,
      mana_value: card.cmc,
      color_identity: card.colorIdentity,
      text: card.oracleText,
      board_section: card.board_section,
      image_url: card.imageUrl,
    }));

    const { error } = await supabase
      .from("user_deck_cards")
      .insert(newCardData);
    if (error) {
      console.error("Failed to save updated deck:", error);
    } else {
      alert("Deck saved successfully!");
    }
  };

  // Populate visibleGroups with all types initially
  useEffect(() => {
    const allTypes = groupByCardType(deck.cards).map((group) => group.type);
    setVisibleGroups(new Set(allTypes));
  }, [deck.cards]);

  return (
    <BoardContent className="overflow-y-auto relative">
      {groupedCardsArray.map((group, index) => (
        <Group key={index}>
          <GroupHeader
            className={`${index !== 0 ? "" : "border-t-0"} `}
            onClick={() => console.log(`Clicked on group: ${group.type}`)}
          >
            <GroupTitle>{group.type}</GroupTitle>
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent header click from firing too
                toggleGroupVisibility(group.type);
              }}
              className="text-dark/40 hover:text-dark/60 bg-darksecondary/10 hover:bg-light/60 rounded-md w-7 h-7  transition-all duration-100 cursor-pointer items-center justify-center flex active:scale-90 hover:shadow-sm"
            >
              {visibleGroups.has(group.type) ? <Minus /> : <ChevronDown />}
            </button>
          </GroupHeader>
          {visibleGroups.has(group.type) && (
            <GroupItems>
              {group.cards.map((card) => (
                <Card className="p-1 relative" key={card.id}>
                  <button
                    className="cursor-pointer w-8 h-8 absolute bg-red-400 flex items-center justify-center rounded-sm mr-3 mt-2 right-0 drop-shadow-md md:hover:scale-110  transition-all duration-100"
                    onClick={() => removeCard(card.id, card.board_section)}
                  >
                    <RxCross2 className="w-6 h-6 text-red-900" />
                  </button>
                  {card.imageUrl && (
                    <Image
                      src={card.imageUrl}
                      width={200}
                      height={200}
                      alt={`Image of ${card.name} card`}
                      className="w-50 rounded-lg shadow"
                    />
                  )}
                </Card>
              ))}
            </GroupItems>
          )}
        </Group>
      ))}
    </BoardContent>
  );
};

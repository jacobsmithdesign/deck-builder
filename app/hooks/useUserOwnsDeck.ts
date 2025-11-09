// hooks/useUserOwnsDeck.ts
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/userContext";
import { supabase } from "@/lib/supabase/client";
import { useCardList } from "../context/CardListContext";

type State = {
  isOwner: boolean;
  error?: string;
};

// This hook checks if the current user owns the deck with the given deckId by checking if there's a deck with that ID and the user's ID as the owner.
export function useUserOwnsDeck(deckId?: string) {
  const { profile } = useUser();
  const { deck } = useCardList();
  const [state, setState] = useState<State>({ isOwner: false });

  useEffect(() => {
    if (deck && profile) {
      setState({ isOwner: profile.id === deck.userId });
    } else {
      setState({ isOwner: false });
    }
  }, [profile, deck]);

  return { ...state };
}

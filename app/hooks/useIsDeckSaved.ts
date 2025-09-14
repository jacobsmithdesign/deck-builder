// hooks/useIsDeckSaved.ts
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/userContext";
import { supabase } from "@/lib/supabase/client";

type State = {
  saved: boolean;
  loading: boolean;
  error?: string;
  linkId?: string;
};

export function useIsDeckSaved(originalDeckId?: string) {
  const { profile } = useUser();
  const [state, setState] = useState<State>({ saved: false, loading: false });

  const refetch = async () => {
    // Safe logging
    // console.log("Refetch check:", { originalDeckId, userId: profile?.id });

    if (!profile?.id || !originalDeckId) return;

    setState((s) => ({
      ...s,
      loading: true,
      error: undefined,
      linkId: undefined,
    }));

    const { data, error } = await supabase
      .from("decks")
      .select("id")
      .eq("user_id", profile.id)
      .eq("original_deck_id", originalDeckId)
      .limit(1)
      .maybeSingle(); // no error on 0 rows

    if (error) {
      setState({ saved: false, loading: false, error: error.message });
    } else {
      setState({
        saved: !!data,
        loading: false,
        linkId: data?.id, // this is the user’s copy id to link to
      });
    }
  };

  useEffect(() => {
    if (profile?.id && originalDeckId) refetch();
  }, [profile?.id, originalDeckId]);

  return { ...state, refetch };
}

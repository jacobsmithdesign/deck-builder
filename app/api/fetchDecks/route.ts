import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const fetchDecks = async () => {
  const { data, error } = await supabase.from("decks").select("*").limit(10);

  if (error) console.error(error);
  return data;
};

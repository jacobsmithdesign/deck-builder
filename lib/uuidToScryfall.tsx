import { supabase } from "./supabase/client";

export async function UuidToScryfall(uuid: string) {
  const { data, error } = await supabase
    .from("cards")
    .select("uuid, name")
    .eq("uuid", `${uuid}`);

  if (error) {
    console.error("Supabase error:", error.message);
    return "";
  }

  if (!data || data.length === 0) {
    console.warn("No scryfallId found for uuid ", uuid);
    return "";
  }
  console.log(data);
  return;
}

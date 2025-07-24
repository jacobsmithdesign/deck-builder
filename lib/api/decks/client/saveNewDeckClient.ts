export async function saveNewDeckClient(payload: {
  preconDeckId: string;
  name: string;
  description: string;
  isPublic: boolean;
}) {
  const res = await fetch("/api/supabase/decks/save-new-deck", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to save deck");
  }
  return json as { success: true; newDeckId: string };
}

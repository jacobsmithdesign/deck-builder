export async function addToCollectionClient(payload: {
  existingDeckId: string;
  name: string;
  description: string;
  isPublic: boolean;
}) {
  const res = await fetch("/api/supabase/decks/add-to-collection", {
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

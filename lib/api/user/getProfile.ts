export async function getProfileFromAPI() {
  const res = await fetch("/api/supabase/user/get-profile", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    console.error("Failed to fetch user profile");
    return null;
  }

  const { profile } = await res.json();
  return profile;
}

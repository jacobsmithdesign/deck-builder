"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getProfileFromAPI } from "@/lib/api/user/getProfile";

type UserProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};

type UserContextType = {
  profile: UserProfile | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    setLoading(true);
    const profile = await getProfileFromAPI();
    setProfile(profile);
    setLoading(false);
  };

  useEffect(() => {
    fetchUserProfile();

    // You could optionally handle auth state change events via Supabase client
    // but you'd want to call fetchUserProfile() again on SIGNED_IN/SIGNED_OUT
  }, []);

  return (
    <UserContext.Provider value={{ profile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};

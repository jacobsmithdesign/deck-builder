"use client";
import { User } from "lucide-react";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { useUser } from "../context/userContext";
import { BoardTitle } from "../deck/components/primitives/Board";
import UserDeckList from "./components/userDeckList";

export default function Profile() {
  const { profile, loading } = useUser();

  if (loading)
    return (
      <div className="pt-13 bg-light h-lvh text-dark">
        <div className="m-2">
          <BoardTitle className="mb-12 px-4">Loading profile...</BoardTitle>
          <UserDeckList />
        </div>
      </div>
    );
  return (
    <div className="flex flex-col h-lvh overflow-scroll hide-scrollbar items-center max-h-lvh  bg-light text-dark pt-15">
      <div className="m-2 w-full">
        <BoardTitle className="mb-12 px-4">
          {profile.username}'s Profile
        </BoardTitle>
        <UserDeckList />
      </div>
    </div>
  );
}

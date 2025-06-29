"use client";
import { User } from "lucide-react";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { useUser } from "../context/userContext";
import { BoardTitle } from "../deck/components/Board";
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
    <div className="pt-13 bg-light h-lvh text-dark">
      <div className="m-2">
        <BoardTitle className="mb-12 px-4">
          {profile.username}'s Profile
        </BoardTitle>
        <UserDeckList />
      </div>
    </div>
  );
}

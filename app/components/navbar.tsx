import { User } from "lucide-react";
import { useUser } from "../context/userContext";
import { Button } from "./ui/button";
import UserIcon from "./ui/userIcon";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      className="absolute w-screen z-50 h-13 flex p-1
     text-dark top-0"
    >
      <div className="flex w-full justify-between items-center bg-dark/15 p-2 pl-4 rounded-xl">
        <Link
          href="/"
          className="font-bold p-1 rounded-md md:hover:bg-light h-8"
        >
          MTG Deck Builder
        </Link>
        <div className="space-x-3">
          {/* Display Log In button or profile button */}
          <UserIcon />
        </div>
      </div>
    </nav>
  );
}

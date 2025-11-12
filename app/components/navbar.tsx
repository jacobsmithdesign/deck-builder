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
      <div className="flex w-full justify-between items-center bg-light/60 p-2 pl-2 rounded-xl">
        <div className="flex gap-2 items-center">
          <Link
            href="/"
            className="font-bold p-1 rounded-lg md:hover:bg-light/70  h-8 flex items-center md:hover:outline outline-light"
          >
            <p className="px-1">MTG Deck Builder</p>
          </Link>
          <Link href="/deck/new">
            <Button variant="primaryBlue">Add New Deck</Button>
          </Link>
        </div>
        <div className="space-x-3">
          {/* Display Log In button or profile button */}
          <UserIcon />
        </div>
      </div>
    </nav>
  );
}

import { User } from "lucide-react";
import { useUser } from "../context/userContext";
import { Button } from "./ui/button";
import UserIcon from "./ui/userIcon";

export default function Navbar() {
  return (
    <nav className="absolute w-screen z-50 h-13 flex bg-light/90 px-4 p-2 border-b border-darksecondary/20 text-dark top-0">
      <div className="flex w-full justify-between items-center">
        <div className="text-lg font-bold">
          <a href="/">MTG Deck Builder</a>
        </div>
        <div className="space-x-4">
          {/* Display Log In button or profile button */}
          <UserIcon />
        </div>
      </div>
    </nav>
  );
}

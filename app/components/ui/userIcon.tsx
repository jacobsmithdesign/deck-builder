"use client";

import { useUser } from "@/app/context/userContext";
import { Button } from "./button";
import DefaultAvatar from "@/public/default-avatar.svg";
import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { RxAvatar, RxExit } from "react-icons/rx";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UserIcon() {
  const { profile, loading } = useUser();
  const [userMenuVisible, setUserMenuVisible] = useState<boolean>(false);

  const router = useRouter();

  const toggleUserMenu = () => {
    setUserMenuVisible((prev) => !prev);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // or router.push("/") to go somewhere else after logout
  };

  if (loading) return null;
  return (
    <Menu>
      {profile ? (
        <MenuButton className="cursor-pointer rounded-full w-8 h-8 overflow-clip items-center justify-center flex outline-dark/20 md:hover:outline-4 transition-all duration-100 focus:outline-none">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} />
          ) : (
            <DefaultAvatar />
          )}
        </MenuButton>
      ) : (
        <Button variant={"login"} size={"sm"}>
          <a href="/auth" className="">
            Log In
          </a>
        </Button>
      )}
      <MenuItems
        transition
        anchor="bottom end"
        className="bg-light mt-2 text-dark rounded-md border border-darksecondary/20 w-48 p-1 data-closed:opacity-0 data-closed:-translate-y-2 transition duration-150 focus:outline-none ml-2 z-50"
      >
        <MenuItem
          as="button"
          className="md:hover:bg-darksecondary/10 w-full text-left rounded-sm p-1 px-2 flex items-center gap-3"
          onClick={() => {
            router.push("/profile");
          }}
        >
          <RxAvatar />
          Your Profile
        </MenuItem>
        <MenuItem
          as="button"
          className="md:hover:bg-darksecondary/10 w-full text-left rounded-sm p-1 px-2 flex items-center gap-3"
          onClick={handleLogout}
        >
          <RxExit />
          Log Out
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}

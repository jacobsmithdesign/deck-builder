"use client";

import { Card } from "@/app/components/ui/card";
import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  RxCross1,
  RxCross2,
  RxHamburgerMenu,
  RxInfoCircled,
  RxMinusCircled,
} from "react-icons/rx";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useCardList } from "@/app/context/CardListContext";
import Tilt from "react-parallax-tilt";
import { CardInfoPanel } from "../cardInfoPanel";
import { CardRecord } from "@/lib/schemas";
import { EditModeProvider, useEditMode } from "@/app/context/editModeContext";
import { IoTrashOutline } from "react-icons/io5";
import { useUser } from "@/app/context/userContext";
import { useUserOwnsDeck } from "@/app/hooks/useUserOwnsDeck";
import ConfirmDelete from "./ConfirmDelete";

interface PerspectiveCardProps {
  id: string;
  image: React.ReactNode;
  label?: React.ReactNode;
  isEditMode?: boolean;
  card: CardRecord;
}

const PerspectiveCard: React.FC<PerspectiveCardProps> = ({
  id,
  image,
  label,
  isEditMode = false,
  card,
}) => {
  const [hovered, setHovered] = useState(false);
  const [deleteClicked, setDeleteClicked] = useState(false);
  const { deck, removeCard } = useCardList();
  const { isOwner } = useUserOwnsDeck(deck?.id);
  const [openInfo, setOpenInfo] = useState<boolean>(false);

  useEffect(() => {
    if (!isEditMode) {
      setDeleteClicked(false); // Reset deleteClicked when not in edit mode
    }
  }, [isEditMode]);

  const toggleInfoPanel = () => {
    setOpenInfo((prev) => !prev);
  };
  return (
    <div className="[perspective:1500px]">
      <div>
        <Tilt
          perspective={800}
          tiltMaxAngleX={6}
          tiltMaxAngleY={6}
          scale={1.05}
          transitionSpeed={500}
          tiltReverse={false}
          onEnter={() => setHovered(true)}
          onLeave={() => setHovered(false)}
          className="relative w-51 h-70 transition-transform duration-300 ease-out [transform-style:preserve-3d] md:hover:[transform:rotateX(var(--y-rotation))_rotateY(var(--x-rotation))] justify-center items-center flex"
        >
          {/* Base card content */}
          <div className=" inset-0 [transform:translateZ(0px)] z-0 pointer-events-none">
            <Card className="p-1">
              {image && typeof image === "string" ? (
                <Image
                  src={image}
                  width={488}
                  height={680}
                  alt={`Image of ${label} card`}
                  className="w-52 rounded-lg select-none"
                />
              ) : (
                <></>
              )}
            </Card>
          </div>
        </Tilt>
      </div>
    </div>
  );
};

export default PerspectiveCard;

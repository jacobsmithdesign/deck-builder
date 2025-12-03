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
import { useEditMode } from "@/app/context/editModeContext";
import { IoTrashOutline } from "react-icons/io5";
import { useUser } from "@/app/context/userContext";
import { useUserOwnsDeck } from "@/app/hooks/useUserOwnsDeck";
import ConfirmDelete from "./ConfirmDelete";

interface PerspectiveCardProps {
  id: string;
  image: React.ReactNode;
  label: React.ReactNode;
  isEditMode: boolean;
  card: CardRecord;
  inspectCard: (id: string) => void;
}

const PerspectiveCard: React.FC<PerspectiveCardProps> = ({
  id,
  image,
  label,
  isEditMode = false,
  card,
  inspectCard,
}) => {
  const [hovered, setHovered] = useState(false);
  const [deleteClicked, setDeleteClicked] = useState(false);
  const { setEditMode } = useEditMode();
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
          className="relative w-46 h-64 transition-transform duration-300 ease-out [transform-style:preserve-3d] md:hover:[transform:rotateX(var(--y-rotation))_rotateY(var(--x-rotation))] justify-center items-center flex"
        >
          {/* These are the menus that appear as an overlay on the card */}
          <div className="w-full h-full absolute z-10 transition-transform duration-300 ease-out  [transform-style:preserve-3d] flex items-center justify-center">
            {/* Confirm delete window */}
            <ConfirmDelete
              deleteClicked={deleteClicked}
              setDeleteClicked={setDeleteClicked}
              card={card}
            />

            {/* Change count window */}
          </div>
          {/* Base card content */}
          <div className=" inset-0 [transform:translateZ(0px)] z-0 pointer-events-none">
            <Card className="p-1">
              {image && typeof image === "string" ? (
                <Image
                  src={image}
                  width={488}
                  height={680}
                  alt={`Image of ${label} card`}
                  className="w-44 rounded-lg select-none"
                />
              ) : (
                <></>
              )}
            </Card>
          </div>
          {/* Floating delete button */}
          <AnimatePresence>
            {hovered && !openInfo && !deleteClicked && isOwner && (
              <motion.div
                key="close"
                initial={{
                  opacity: 0,
                  z: 0,
                  scale: 0,
                  backdropFilter: "blur(0px)",
                }}
                animate={{
                  opacity: 1,
                  z: 25,
                  scale: 1,
                  backdropFilter: "blur(2.5px)",
                }}
                exit={{
                  opacity: 0,
                  z: 0,
                  scale: 0.0,
                  backdropFilter: "blur(0px)",
                }}
                whileTap={{ z: 10, scale: 0.95, backdropFilter: "blur(1px)" }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 30,
                  bounce: 3,
                  duration: 0.005,
                }}
                className="will-change-[transform,opacity] absolute cursor-pointer justify-center z-10 drop-shadow-xl rounded-lg bg-light/60 md:hover:bg-red-600/60 ml-9 text-red-500 top-9 right-5 transition-colors duration-150 overflow-visible group shadow-inner shadow-light/60 md:hover:shadow-light/30 border border-light/30 w-8 h-8 items-center flex"
                onClick={() => setDeleteClicked(true)}
              >
                <IoTrashOutline className="h-4 w-4 mb-2 text-red-600 md:group-hover:text-light mt-1.5 transition-colors duration-150" />
              </motion.div>
            )}
            {card.count > 1 && (
              <motion.div
                key={`count-${id}`}
                initial={{ opacity: 0, z: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  z: 20,
                  scale: 1,
                }}
                exit={{ opacity: 0, z: 0, scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 30,
                  bounce: 3,
                  duration: 0.005,
                }}
                className="will-change-[transform,opacity] absolute cursor-pointer justify-center items-center flex z-10 drop-shadow-xl rounded-lg bg-dark left-5 text-light top-9 w-fit px-2 h-8 transition-colors duration-100 overflow-visible font-bold"
              >
                x {card.count}
              </motion.div>
            )}

            {/* Floating info button */}
            {/* {hovered && !deleteClicked && !openInfo && (
              <>
                <motion.div
                  key="info"
                  initial={{
                    opacity: 0,
                    z: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: 1,
                    z: 20,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    z: 0,
                    scale: 0.0,
                  }}
                  whileTap={{ z: 5, scale: 0.9 }}
                  whileHover={{ width: 100 }}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 30,
                    bounce: 3,
                    duration: 0.005,
                  }}
                  className={`will-change-[transform,opacity] absolute cursor-pointer left-5 top-9 z-10 drop-shadow-xl rounded-lg bg-light w-8 text-dark/80 hover:text-dark ${
                    isEditMode ? "mr-7 " : ""
                  }`}
                  onClick={() => {
                    inspectCard(id);
                    toggleInfoPanel();
                  }}
                >
                  <div className="w-full h-8 font-bold text-sm flex items-center overflow-x-clip relative">
                    <RxInfoCircled className="w-6 h-6 ml-1" />
                    <p className="w-20 absolute ml-6 ">More info</p>
                  </div>
                </motion.div>
              </>
            )} */}

            {/* Below consists of the confirm delete popup window. The delete and cancel buttons and placed above a bottom plate to achieve desired floating design */}
          </AnimatePresence>
          {/* Card information panel */}
          {openInfo && (
            <CardInfoPanel
              closeInfoPanel={openInfo}
              card={card}
              setCloseInfoPanel={toggleInfoPanel}
            />
          )}
        </Tilt>
      </div>
    </div>
  );
};

export default PerspectiveCard;

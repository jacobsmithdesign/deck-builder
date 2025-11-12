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
import { CardInfoPanel } from "./cardInfoPanel";
import { CardRecord } from "@/lib/schemas";

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
  const boundingRef = useRef<DOMRect | null>(null);
  const [hovered, setHovered] = useState(false);
  const [deleteClicked, setDeleteClicked] = useState(false);
  const { removeCard } = useCardList();
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
          perspective={1500}
          tiltMaxAngleX={6}
          tiltMaxAngleY={6}
          scale={1.05}
          transitionSpeed={500}
          tiltReverse={true}
          onEnter={() => setHovered(true)}
          onLeave={() => setHovered(false)}
          className="relative w-46 h-64 transition-transform duration-300 ease-out [transform-style:preserve-3d] md:hover:[transform:rotateX(var(--y-rotation))_rotateY(var(--x-rotation))] justify-center items-center flex"
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
                  className="w-44 rounded-lg select-none"
                />
              ) : (
                <></>
              )}
            </Card>
          </div>

          {/* Floating delete button */}
          <AnimatePresence>
            {isEditMode && !openInfo && (
              <motion.div
                key="close"
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
                transition={{
                  type: "spring",
                  stiffness: 650,
                  damping: 20,
                  bounce: 3,
                  duration: 0.005,
                }}
                className="will-change-[transform,opacity] absolute cursor-pointer justify-center z-10 drop-shadow-xl rounded-lg bg-light md:hover:bg-buttonRedHover ml-9 text-buttonRed top-9 right-5 w-8 h-8 transition-colors duration-100 overflow-visible "
                onClick={() => setDeleteClicked(true)}
              >
                <div className="w-8 h-8 text-shadow-lg font-bold text-sm flex justify-center items-center">
                  <RxCross2 className="w-6 h-6" />
                </div>
              </motion.div>
            )}

            {/* Floating info button */}
            {hovered && !deleteClicked && !openInfo && (
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
            )}

            {/* Popup for Confirm Delete */}
            {deleteClicked && (
              <motion.div
                key="popup"
                initial={{
                  opacity: 0,
                  z: 0,
                  scale: 0.95,
                  backdropFilter: "blur(0px)",
                }}
                animate={{
                  opacity: 1,
                  z: 10,
                  scale: 1,
                  backdropFilter: "blur(4px)",
                }}
                exit={{
                  opacity: 0,
                  z: 0,
                  scale: 0.95,
                  backdropFilter: "blur(0px)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 20,
                  bounce: 1,
                  duration: 0.005,
                }}
                className={`will-change-[transform,opacity] absolute justify-center z-10 drop-shadow-xl border border-light/40 rounded-lg bg-light/70 text-dark p-2 flex flex-col items-between text-center md:text-sm text-xs`}
              >
                <p>Confirm</p>
                {/* Remove button */}
                <AnimatePresence>
                  <div className="flex gap-1 mt-2">
                    <motion.div
                      key="confirmRemove"
                      initial={{
                        opacity: 1,
                        scale: 1,
                      }}
                      animate={{
                        opacity: 1,
                        z: 10,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        z: 0,
                        scale: 0.8,
                      }}
                      whileTap={{
                        z: 15,
                        scale: 0.9,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 650,
                        damping: 20,
                        bounce: 3,
                        duration: 0.005,
                      }}
                      className=" cursor-pointer justify-center z-10 rounded-sm hover:bg-buttonRedHoverDark text-buttonRed p-1 items-center flex h-6 px-2 transition-colors duration-150 pt-1.5"
                      onClick={() => {
                        console.log("Removing", card);
                        if (card) removeCard(card);
                      }}
                    >
                      <p>Remove</p>
                    </motion.div>
                    <motion.div
                      key="cancelRemove"
                      initial={{
                        opacity: 0,
                        z: 10,
                        scale: 0.8,
                      }}
                      animate={{
                        opacity: 1,
                        z: 30,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        z: 0,
                        scale: 0.8,
                      }}
                      whileTap={{
                        z: 15,
                        scale: 0.9,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 650,
                        damping: 20,
                        bounce: 3,
                        duration: 0.005,
                      }}
                      className="cursor-pointer z-10 rounded-sm md:hover:bg-light text-dark justify-center flex items-center  p-1 h-6 px-2 transition-colors duration-150 pt-1.5"
                      onClick={() => setDeleteClicked(false)}
                    >
                      <p>Cancel</p>
                    </motion.div>
                  </div>
                </AnimatePresence>
              </motion.div>
            )}
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

"use client";

import { Card } from "@/app/components/ui/card";
import Image from "next/image";
import { useRef } from "react";
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

interface PerspectiveCardProps {
  id: string;
  image: React.ReactNode;
  label: React.ReactNode;
  isEditMode: boolean;
}

const PerspectiveCard: React.FC<PerspectiveCardProps> = ({
  id,
  image,
  label,
  isEditMode = false,
}) => {
  const boundingRef = useRef<DOMRect | null>(null);
  const [hovered, setHovered] = useState(false);
  const [deleteClicked, setDeleteClicked] = useState(false);
  const { removeCard } = useCardList();

  return (
    <div className="flex flex-col [perspective:1500px]">
      <div
        onMouseEnter={(ev) => {
          setHovered(true);
          boundingRef.current = ev.currentTarget.getBoundingClientRect();
        }}
        onMouseLeave={() => {
          boundingRef.current = null;
          setHovered(false);
        }}
        onMouseMove={(ev) => {
          if (!boundingRef.current) return;
          const x = ev.clientX - boundingRef.current.left;
          const y = ev.clientY - boundingRef.current.top;
          const xPct = x / boundingRef.current.width;
          const yPct = y / boundingRef.current.height;
          const xRotation = (xPct - 0.5) * 8;
          const yRotation = (0.5 - yPct) * 8;

          ev.currentTarget.style.setProperty("--x-rotation", `${xRotation}deg`);
          ev.currentTarget.style.setProperty("--y-rotation", `${yRotation}deg`);
          ev.currentTarget.style.setProperty("--x", `${xPct * 100}%`);
          ev.currentTarget.style.setProperty("--y", `${yPct * 100}%`);
        }}
        className="relative w-60 h-80 transition-transform duration-300 ease-out [transform-style:preserve-3d] md:hover:[transform:rotateX(var(--y-rotation))_rotateY(var(--x-rotation))] justify-center items-center flex group "
      >
        {/* Base card content */}
        <div className=" inset-0 [transform:translateZ(0px)] z-0 pointer-events-none">
          <Card className="p-1">
            {image && typeof image === "string" ? (
              <Image
                src={image}
                width={200}
                height={200}
                alt={`Image of ${label} card`}
                className="w-50 rounded-lg select-none "
              />
            ) : (
              <></>
            )}
          </Card>
        </div>

        {/* Floating delete button */}
        <AnimatePresence>
          {isEditMode && (
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
                z: 20,
                scale: 1,
                backdropFilter: "blur(4px)",
              }}
              exit={{
                opacity: 0,
                z: 0,
                scale: 0.0,
                backdropFilter: "blur(6px)",
              }}
              whileTap={{ z: 5, scale: 0.9, backdropFilter: "blur(2px)" }}
              transition={{
                type: "spring",
                stiffness: 650,
                damping: 20,
                bounce: 3,
                duration: 0.005,
              }}
              className="will-change-[transform,opacity] absolute cursor-pointer justify-center z-10 drop-shadow-xl border border-light/40 md:hover:border-red-500/30 rounded-lg bg-light/60 hover:bg-red-900/20 ml-9 text-dark md:hover:text-red-700 top-2 right-2"
              onClick={() => setDeleteClicked(true)}
            >
              <div className="w-8 h-8 text-shadow-lg font-bold text-sm flex justify-center items-center">
                <RxCross2 className="w-6 h-6" />
              </div>
            </motion.div>
          )}

          {/* Floating info button */}
          {hovered && (
            <>
              <motion.div
                key="info"
                initial={{
                  opacity: 0,
                  z: 0,
                  scale: 0,
                  backdropFilter: "blur(1px)",
                }}
                animate={{
                  opacity: 1,
                  z: 20,
                  scale: 1,
                  backdropFilter: "blur(4px)",
                }}
                exit={{
                  opacity: 0,
                  z: 0,
                  scale: 0.0,
                  backdropFilter: "blur(6px)",
                }}
                whileTap={{ z: 5, scale: 0.9, backdropFilter: "blur(2px)" }}
                transition={{
                  type: "spring",
                  stiffness: 650,
                  damping: 20,
                  bounce: 3,
                  duration: 0.005,
                }}
                className={`will-change-[transform,opacity] absolute cursor-pointer justify-center z-10 drop-shadow-xl border border-light/40 md:hover:border-light/40 rounded-lg bg-light/60 hover:bg-darksecondary/20 text-dark md:hover:text-light top-2 right-2 ${
                  isEditMode ? "mr-9 " : ""
                }`}
              >
                <div className="w-8 h-8 text-shadow-lg font-bold text-sm flex justify-center items-center">
                  <RxInfoCircled className="w-6 h-6" />
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
                scale: 0.9,
                backdropFilter: "blur(0px)",
              }}
              animate={{
                opacity: 1,
                z: 10,
                scale: 1,
                backdropFilter: "blur(3px)",
              }}
              exit={{
                opacity: 0,
                z: 0,
                scale: 0.9,
                backdropFilter: "blur(0px)",
              }}
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 20,
                bounce: 3,
                duration: 0.005,
              }}
              className={`will-change-[transform,opacity] absolute justify-center z-10 drop-shadow-xl border border-light/40 rounded-lg bg-light/60 text-dark font-bold p-2 flex flex-col items-between text-center`}
            >
              <p>Are you sure?</p>
              {/* Remove button */}
              <div className="flex gap-1 mt-2">
                <motion.div
                  key="confirmRemove"
                  initial={{
                    opacity: 0,
                    z: 10,
                    scale: 0.8,
                    backdropFilter: "blur(0px)",
                  }}
                  animate={{
                    opacity: 1,
                    z: 30,
                    scale: 1,
                    backdropFilter: "blur(2px)",
                  }}
                  exit={{
                    opacity: 0,
                    z: 0,
                    scale: 0.8,
                    backdropFilter: "blur(0px)",
                  }}
                  whileTap={{ z: 15, scale: 0.9, backdropFilter: "blur(0px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 650,
                    damping: 20,
                    bounce: 3,
                    duration: 0.005,
                  }}
                  className=" cursor-pointer justify-center z-10 drop-shadow-xl rounded-sm bg-red-600/20 md:hover:bg-red-600/30 text-red-800 md:hover:text-red-700 p-2"
                  onClick={() => removeCard(id)}
                >
                  <p>Remove</p>
                </motion.div>
                <motion.div
                  key="cancelRemove"
                  initial={{
                    opacity: 0,
                    z: 10,
                    scale: 0.8,
                    backdropFilter: "blur(1px)",
                  }}
                  animate={{
                    opacity: 1,
                    z: 30,
                    scale: 1,
                    backdropFilter: "blur(2px)",
                  }}
                  exit={{
                    opacity: 0,
                    z: 0,
                    scale: 0.8,
                    backdropFilter: "blur(2px)",
                  }}
                  whileTap={{ z: 15, scale: 0.9, backdropFilter: "blur(0px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 650,
                    damping: 20,
                    bounce: 3,
                    duration: 0.005,
                  }}
                  className="cursor-pointer z-10 drop-shadow-xl md:hover:border-light/10 rounded-sm bg-light/40 md:hover:bg-light text-dark justify-center p-2"
                  onClick={() => setDeleteClicked(false)}
                >
                  <p>Cancel</p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PerspectiveCard;

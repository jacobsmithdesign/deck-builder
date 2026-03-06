import { useCompactView } from "@/app/context/compactViewContext";
import {
  useDeckView,
  type DeckViewType,
  type DeckSortOption,
} from "@/app/context/DeckViewContext";
import { DeckFilterDropdown } from "./DeckFilterDropdown";
import SearchBox from "../primitives/SearchBox";
import UnsavedChanges from "../overlays/UnsavedChanges";
import AddToCollectionButton from "../primitives/AddToCollectionButton";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/app/context/userContext";
import { useCardList } from "@/app/context/CardListContext";
import {
  searchCardForDeck,
  selectCardDataFromId,
} from "@/lib/db/searchCardForDeck";
import { useEditMode } from "@/app/context/editModeContext";
import { RaindropContainer } from "../primitives/RaindropContainer";
import { AnimatedButton } from "../primitives/AnimatedButton";
import { AnimatePresence, motion } from "framer-motion";
import {
  BsSortDown,
  BsWindow,
  BsListUl,
  BsImages,
  BsArrowUpShort,
  BsArrowDownShort,
  BsSortAlphaDown,
  BsSortAlphaUp,
  BsSortNumericUp,
  BsSortNumericDown,
} from "react-icons/bs";
import {
  AiOutlineSortAscending,
  AiOutlineSortDescending,
} from "react-icons/ai";
import { RiFilter2Line } from "react-icons/ri";

const STAGGER_S = 0.1;

type SortKey = "deck" | "name" | "mana";

const sortOptions: {
  key: SortKey;
  label: string;
}[] = [
  { key: "deck", label: "Deck order" },
  { key: "name", label: "Name" },
  { key: "mana", label: "Mana cost" },
];

const viewOptions: {
  value: DeckViewType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "cards", label: "Cards", icon: <BsWindow className="w-4 h-4" /> },
  { value: "list", label: "List", icon: <BsListUl className="w-4 h-4" /> },
  {
    value: "stacked-list",
    label: "Stacked",
    icon: <BsImages className="w-4 h-4" />,
  },
];

export default function DeckControls() {
  const { deck, addCard } = useCardList();
  const { profile } = useUser();
  const { view, setView, sortOption, setSortOption, hasActiveFilters } =
    useDeckView();
  const [viewOpen, setViewOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [userOwnsDeck, setUserOwnsDeck] = useState<boolean>(false);
  const { setEditMode } = useEditMode();

  const isLoggedIn = !!profile;
  const showAddToCollection = isLoggedIn && !userOwnsDeck;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(target)
      ) {
        setViewOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(target)
      ) {
        setSortOpen(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target)
      ) {
        setFilterOpen(false);
      }
    };
    if (viewOpen || sortOpen || filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewOpen, sortOpen, filterOpen]);

  useEffect(() => {
    if (deck && profile) {
      setUserOwnsDeck(profile.id === deck.userId);
    }
  }, [profile, deck]);
  const { bgColor } = useCompactView();
  const addSelectedCard = async (uuid: string) => {
    const card = await selectCardDataFromId(uuid);
    addCard(card);
    setEditMode(true);
  };
  return (
    <div className="absolute z-20 flex w-full pr-4 pt-2 h-10 pl-1">
      <RaindropContainer
        className="w-full h-10 rounded-full drop-shadow-xl backdrop-blur-sm p-0 from-light/80"
        innerClassName="scale-100 outline-light border-t border-light/20 outline"
        bgColor={bgColor ? bgColor : "light"}
      ></RaindropContainer>
      <div className="absolute w-full items-center h-10 pl-2 pr-6 grid grid-cols-3">
        {userOwnsDeck && (
          <>
            <div className="relative flex mb-6">
              <div className="absolute">
                <UnsavedChanges />
              </div>
            </div>
            <div className="flex justify-center">
              <SearchBox
                searchFunction={searchCardForDeck}
                selectFunction={addSelectedCard}
                placeholder="Search for new card"
                padding={12}
              />
            </div>
          </>
        )}

        <div
          className={`flex justify-end gap-1 items-start ${
            !userOwnsDeck ? "col-start-1 col-span-3" : ""
          }`}
        >
          {showAddToCollection && (
            <div className="flex items-center">
              <AddToCollectionButton />
            </div>
          )}
          {/* View Button + dropdown bubbles */}
          <div className="relative" ref={viewDropdownRef}>
            <button
              onClick={() => setViewOpen((o) => !o)}
              className="contents"
              aria-expanded={viewOpen}
              aria-haspopup="true"
            >
              <AnimatedButton
                variant="raindrop"
                className="w-fit h-8 rounded-full bg-light/0 font-bold text-dark/80 gap-1"
                title="View"
                icon={<BsWindow className="w-5 h-4" />}
              />
            </button>
            <AnimatePresence>
              {viewOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    transition: { delay: 0.1 },
                  }}
                  transition={{
                    duration: 0.1,
                  }}
                  className="absolute top-full right-0 mt-2 flex flex-col gap-1.5 p-1  z-50 bg-light/30 backdrop-blur-sm rounded-2xl"
                >
                  {viewOptions.map((option, index) => (
                    <motion.div
                      key={option.value}
                      initial={{
                        opacity: 0,
                        scale: 0.85,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 350,
                          damping: 15,
                          bounce: 1,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0,
                        transition: { duration: 0.15 },
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 15,
                        bounce: 0.5,
                      }}
                    >
                      <RaindropContainer
                        bgColor={bgColor}
                        className={`cursor-pointer rounded-full drop-shadow-md backdrop-blur-sm py-1.5 flex items-center gap-2 w-full transition-colors ${
                          view === option.value
                            ? "bg-light"
                            : "from-light/60 hover:from-light/90"
                        }`}
                        innerClassName="scale-100 rounded-full border border-light/20 opacity-12"
                        childClassName="px-4 flex gap-2"
                        onClick={() => {
                          setView(option.value);
                          setViewOpen(false);
                        }}
                      >
                        {option.icon}
                        <span className="font-bold text-dark/80 text-sm">
                          {option.label}
                        </span>
                      </RaindropContainer>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Sort Button + dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className="contents"
              aria-expanded={sortOpen}
              aria-haspopup="true"
            >
              <AnimatedButton
                variant="raindrop"
                className="w-fit h-8 rounded-full bg-light/0 font-bold text-dark/80 gap-1"
                title="Sort"
                icon={<BsSortDown className="w-5 h-4" />}
              />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    transition: { delay: 0.1, duration: 0.12 },
                  }}
                  transition={{
                    duration: 0.15,
                  }}
                  className="absolute top-full right-0 mt-2 flex flex-col gap-1.5 p-1 min-w-34 z-50 bg-light/30 backdrop-blur-sm rounded-2xl"
                >
                  {sortOptions.map((option, index) => {
                    const isName = option.key === "name";
                    const isMana = option.key === "mana";
                    const isDeck = option.key === "deck";

                    const isNameActive =
                      isName &&
                      (sortOption === "name-asc" || sortOption === "name-desc");
                    const isManaActive =
                      isMana &&
                      (sortOption === "mana-asc" || sortOption === "mana-desc");

                    const isDesc =
                      (isName && sortOption === "name-desc") ||
                      (isMana && sortOption === "mana-desc");

                    const ArrowIcon = isDesc
                      ? isName
                        ? BsSortAlphaDown
                        : BsSortNumericDown
                      : isName
                        ? BsSortAlphaUp
                        : BsSortNumericUp;

                    return (
                      <motion.div
                        key={option.key}
                        initial={{
                          opacity: 0,
                          scale: 0.85,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 350,
                            damping: 15,
                            bounce: 1,
                          },
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0,
                          transition: { duration: 0.15, delay: 0 },
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 15,
                          bounce: 0.5,
                          delay: 0,
                        }}
                      >
                        <RaindropContainer
                          bgColor={bgColor}
                          className={`cursor-pointer rounded-full drop-shadow-md backdrop-blur-sm py-1.5 flex items-center gap-2 w-full transition-colors ${
                            (isDeck && sortOption === "deck") ||
                            isNameActive ||
                            isManaActive
                              ? "bg-light"
                              : "from-light/60 hover:from-light/90"
                          }`}
                          innerClassName="scale-100 rounded-full border border-light/20 opacity-12"
                          childClassName="px-4 flex gap-2 items-center justify-between w-full"
                          onClick={() => {
                            if (option.key === "deck") {
                              setSortOption("deck");
                            } else if (option.key === "name") {
                              if (sortOption === "name-asc") {
                                setSortOption("name-desc");
                              } else {
                                setSortOption("name-asc");
                              }
                            } else if (option.key === "mana") {
                              if (sortOption === "mana-asc") {
                                setSortOption("mana-desc");
                              } else {
                                setSortOption("mana-asc");
                              }
                            }
                          }}
                        >
                          <span className="font-bold text-dark/80 text-sm">
                            {option.label}
                          </span>
                          {(isName || isMana) && (
                            <ArrowIcon className="w-4 h-4 text-dark/70" />
                          )}
                        </RaindropContainer>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Filter Button + dropdown */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="contents"
              aria-expanded={filterOpen}
              aria-haspopup="true"
            >
              <AnimatedButton
                variant="raindrop"
                className={`w-fit h-8 rounded-full font-bold gap-1 ${
                  hasActiveFilters
                    ? "bg-light/80 text-dark"
                    : "bg-light/0 text-dark/80"
                }`}
                title="Filters"
                icon={<RiFilter2Line className="w-5 h-4" />}
              />
            </button>
            <DeckFilterDropdown
              isOpen={filterOpen}
              onClose={() => setFilterOpen(false)}
              anchorRef={filterDropdownRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

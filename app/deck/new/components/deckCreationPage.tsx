"use client";
import { CardTitle } from "@/app/components/ui/card";
import { CardLine, parseDeckText } from "@/app/hooks/parseDeckText";
import { JSXElementConstructor, useState } from "react";
import { Button } from "../../components/primitives/button";
import ImportDeckForm from "./importDeckForm";
import { AnimatePresence, motion } from "framer-motion";
import { useMeasuredHeight } from "../../../hooks/useMeasuredHeight";
import BlankDeckForm from "./blankDeckForm";
export default function DeckCreationPage() {
  // Conditions for rendering ui
  const [selectImport, setSelectImport] = useState<boolean>(false);
  const [selectScratch, setSelectScratch] = useState<boolean>(false);

  // ref for element height
  const importMeasure = useMeasuredHeight<HTMLDivElement>(selectImport);
  const scratchMeasure = useMeasuredHeight<HTMLDivElement>(selectScratch);

  return (
    <div className="h-lvh flex flex-col justify-center text-dark pt-15 w-96 mx-auto text-center">
      {/* Initial selection screen */}
      <AnimatePresence>
        {!(selectImport || selectScratch) && (
          <motion.div
            key="selection-component"
            className="flex flex-col gap-5 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 100, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardTitle>Create a new deck</CardTitle>
            <div className="flex gap-4 justify-center">
              <Button
                variant="secondaryBlue"
                size="lg"
                onClick={() => setSelectScratch(true)}
              >
                Start from scratch
              </Button>
              <Button
                variant="secondaryBlue"
                size="lg"
                onClick={() => setSelectImport(true)}
              >
                Import card lists
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* start from scratch selection form */}
      <AnimatePresence initial={false}>
        {selectScratch && (
          <motion.div
            key="import-wrapper"
            initial={{ height: 0 }}
            animate={{ height: scratchMeasure.h }}
            exit={{ height: 0 }}
          >
            <motion.div
              ref={scratchMeasure.ref}
              key="importDeckForm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BlankDeckForm
                onCancel={() => {
                  setSelectScratch(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import cards selection form */}
      <AnimatePresence initial={false}>
        {selectImport && (
          <motion.div
            key="import-wrapper"
            initial={{ height: 0 }}
            animate={{ height: importMeasure.h }}
            exit={{ height: 0 }}
          >
            <motion.div
              ref={importMeasure.ref}
              key="importDeckForm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ImportDeckForm
                onCancel={() => {
                  setSelectImport(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

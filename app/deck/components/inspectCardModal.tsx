"use client";

import { CardRecord } from "@/lib/schemas";
import { RxCross2 } from "react-icons/rx";

export default function InspectCardModal({
  setClose,
  card,
}: {
  setClose: () => void;
  card: CardRecord;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full">
        <button
          className="absolute top-4 right-4 text-dark"
          onClick={() => {
            setClose();
          }}
        >
          <RxCross2 className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold mb-2">Card Info</h2>
        <p className="text-sm">Card ID: {card.uuid}</p>
        <p>Card Name: {card.name}</p>
        {/* You could display more info here using the selectedCardId */}
      </div>
    </div>
  );
}

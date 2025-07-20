import { useState, useEffect } from "react";
import { filterAndGroupCards } from "@/lib/utils";
import { CardFilter } from "@/lib/utils";
import { searchCardsWithFilters } from "@/lib/db/searchCardsWithFilters";

export function useCardSearch(
  filters: CardFilter,
  page: number,
  pageSize = 30
) {
  const [cards, setCards] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [groupedCards, setGroupedCards] = useState<any[]>([]);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        const results = await searchCardsWithFilters({
          ...filters,
          page,
          pageSize,
        });

        const allCards = page === 0 ? results : [...cards, ...results];
        setCards(allCards);
        setHasMore(results.length > 0);

        const grouped = filterAndGroupCards(
          allCards,
          filters.groupBy || "type"
        );
        setGroupedCards(grouped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [filters, page]);

  return { groupedCards, hasMore, loading };
}

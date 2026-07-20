"use client";

import { useEffect, useState } from "react";
import {
  OpportunityCard,
  type OpportunityCardData,
} from "@/components/opportunities/opportunity-card";

export default function SavedPage() {
  const [items, setItems] = useState<OpportunityCardData[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setItems(j.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Saved opportunities</h1>
      <p className="mb-6 text-sm text-zinc-500">Bookmarks you want to revisit and apply to.</p>
      {loading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-zinc-500">
          No saved opportunities yet. Bookmark items from the feed.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              onBookmarkChange={(id, bookmarked) => {
                if (!bookmarked) setItems((prev) => prev.filter((x) => x.id !== id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

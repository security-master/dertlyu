"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GenerationStatus } from "@/types/generation";

interface HistoryItem {
  id: string;
  status: GenerationStatus;
  imageUrl: string | null;
  prompt: string;
  width: number;
  height: number;
  createdAt: string;
}

export function HistoryGrid() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/generations");
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError("Failed to load generation history.");
          return;
        }

        setItems(data.generations);
      } catch {
        setError("Unable to load history. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No generations yet.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Create your first image
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/history/${item.id}`}
          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"
        >
          {item.status === "completed" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl ?? `/api/generations/${item.id}/image`}
              alt={item.prompt}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
              {item.status === "failed" ? "Failed" : item.status}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

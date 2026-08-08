"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicGeneration } from "./generate-form";

export function HistoryGrid() {
  const [items, setItems] = useState<PublicGeneration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/generations");
        const payload = (await response.json()) as {
          success: boolean;
          data?: PublicGeneration[];
          error?: { message: string };
        };
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message ?? "Failed to load history.");
        }
        if (!cancelled) setItems(payload.data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load history.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="progress-note">Loading your generations…</p>;
  }

  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No generations yet.</p>
        <Link href="/" className="btn btn-primary">
          Create your first image
        </Link>
      </div>
    );
  }

  return (
    <ul className="history-grid">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/history/${item.id}`} className="history-tile">
            {item.thumbnailUrl || item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbnailUrl ?? item.imageUrl ?? ""}
                alt={item.prompt}
                loading="lazy"
              />
            ) : (
              <div className="history-tile__fallback" aria-hidden="true">
                {item.status}
              </div>
            )}
            <span className="history-tile__caption">{item.prompt}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

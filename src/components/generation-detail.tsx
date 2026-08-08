"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicGeneration } from "./generate-form";

async function downloadImage(generation: PublicGeneration) {
  if (!generation.imageUrl) return;
  const response = await fetch(generation.imageUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const ext =
    generation.imageUrl.match(/\.(png|jpg|jpeg|webp)(?:\?|$)/i)?.[1] ?? "jpg";
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `generated-${generation.createdAt.slice(0, 10)}-${generation.id}.${ext}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function GenerationDetail({ id }: { id: string }) {
  const [generation, setGeneration] = useState<PublicGeneration | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/generations/${id}`);
        const payload = (await response.json()) as {
          success: boolean;
          data?: PublicGeneration;
          error?: { message: string };
        };
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error?.message ?? "Generation not found.");
        }
        if (!cancelled) setGeneration(payload.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="empty-state">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Link href="/history" className="btn btn-ghost">
          Back to history
        </Link>
      </div>
    );
  }

  if (!generation) {
    return <p className="progress-note">Loading generation…</p>;
  }

  return (
    <article className="detail-view">
      {generation.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="detail-image"
          src={generation.imageUrl}
          alt={generation.prompt}
        />
      ) : null}

      <div className="detail-copy">
        <h1>Generation detail</h1>
        <p className="detail-prompt">{generation.prompt}</p>
        <dl className="detail-meta">
          <div>
            <dt>Created</dt>
            <dd>{new Date(generation.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Dimensions</dt>
            <dd>
              {generation.width} × {generation.height}
            </dd>
          </div>
          {generation.style ? (
            <div>
              <dt>Style</dt>
              <dd>{generation.style}</dd>
            </div>
          ) : null}
          {generation.model ? (
            <div>
              <dt>Model</dt>
              <dd>{generation.model}</dd>
            </div>
          ) : null}
          {generation.provider ? (
            <div>
              <dt>Provider</dt>
              <dd>{generation.provider}</dd>
            </div>
          ) : null}
          <div>
            <dt>Status</dt>
            <dd>{generation.status}</dd>
          </div>
        </dl>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void downloadImage(generation)}
            disabled={!generation.imageUrl}
          >
            Download
          </button>
          <Link href="/history" className="btn btn-ghost">
            Back to history
          </Link>
          <Link href="/" className="btn btn-ghost">
            New generation
          </Link>
        </div>
      </div>
    </article>
  );
}

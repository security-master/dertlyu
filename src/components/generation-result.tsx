"use client";

import type { PublicGeneration } from "./generate-form";

function downloadFilename(generation: PublicGeneration) {
  const date = generation.createdAt.slice(0, 10);
  const ext =
    generation.imageUrl?.match(/\.(png|jpg|jpeg|webp)(?:\?|$)/i)?.[1] ?? "jpg";
  return `generated-${date}-${generation.id}.${ext}`;
}

async function downloadImage(generation: PublicGeneration) {
  if (!generation.imageUrl) return;
  const response = await fetch(generation.imageUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = downloadFilename(generation);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function GenerationResult({
  generation,
  onRetry,
  onNew,
  isPending,
}: {
  generation: PublicGeneration | null;
  onRetry: () => void;
  onNew: () => void;
  isPending: boolean;
}) {
  if (!generation && !isPending) {
    return (
      <section className="result-panel" aria-label="Generated image">
        <h2>Generated image</h2>
        <div className="result-placeholder">
          <p>Your image will appear here after generation.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="result-panel" aria-label="Generated image">
      <h2>Generated image</h2>
      {isPending && !generation ? (
        <div className="result-placeholder result-placeholder--loading">
          <span className="spinner" aria-hidden="true" />
          <p>Generating…</p>
        </div>
      ) : null}

      {generation?.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="result-image"
            src={generation.imageUrl}
            alt={generation.prompt}
            width={generation.width}
            height={generation.height}
          />
          <div className="result-meta">
            <p>
              <span className="meta-label">Status</span> {generation.status}
            </p>
            {generation.model ? (
              <p>
                <span className="meta-label">Model</span> {generation.model}
              </p>
            ) : null}
            <p>
              <span className="meta-label">Size</span> {generation.width} ×{" "}
              {generation.height}
            </p>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void downloadImage(generation)}
            >
              Download
            </button>
            <button type="button" className="btn btn-ghost" onClick={onNew}>
              New generation
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onRetry}
              disabled={isPending}
            >
              Regenerate
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

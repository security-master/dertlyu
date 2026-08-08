"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  ASPECT_RATIOS,
  RESOLUTIONS,
  STYLES,
  type AspectRatio,
} from "@/lib/ai/types";
import { GenerationResult } from "./generation-result";

export type PublicGeneration = {
  id: string;
  prompt: string;
  negativePrompt: string | null;
  provider: string | null;
  model: string | null;
  width: number;
  height: number;
  aspectRatio: string | null;
  style: string | null;
  seed: number | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
};

type ApiError = {
  code: string;
  message: string;
};

const STYLE_LABELS: Record<string, string> = {
  auto: "Auto",
  realistic: "Realistic",
  cinematic: "Cinematic",
  illustration: "Illustration",
  anime: "Anime",
  "3d": "3D",
  watercolor: "Watercolor",
};

export function GenerateForm() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("realistic");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState("1024x1024");
  const [error, setError] = useState<ApiError | null>(null);
  const [generation, setGeneration] = useState<PublicGeneration | null>(null);
  const [isPending, startTransition] = useTransition();

  async function generate() {
    setError(null);
    const [width, height] = resolution.split("x").map(Number);
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        negativePrompt: negativePrompt || undefined,
        style,
        aspectRatio,
        width,
        height,
        model: "auto",
      }),
    });

    const payload = (await response.json()) as {
      success: boolean;
      data?: PublicGeneration;
      error?: ApiError;
    };

    if (!response.ok || !payload.success || !payload.data) {
      setError(
        payload.error ?? {
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again.",
        },
      );
      return;
    }

    setGeneration(payload.data);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || isPending) return;
    startTransition(() => {
      void generate();
    });
  }

  function onNewGeneration() {
    setGeneration(null);
    setError(null);
  }

  return (
    <div className="generate-layout">
      <form className="generate-form" onSubmit={onSubmit} aria-busy={isPending}>
        <label className="field">
          <span className="field__label">Describe your image</span>
          <textarea
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            maxLength={2000}
            required
            placeholder="A cinematic portrait of a dancer in rain-soaked neon streets…"
            disabled={isPending}
          />
        </label>

        <label className="field">
          <span className="field__label">Negative prompt (optional)</span>
          <input
            name="negativePrompt"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            maxLength={1000}
            placeholder="blurry, low quality, watermark"
            disabled={isPending}
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span className="field__label">Style</span>
            <select
              value={style}
              onChange={(e) =>
                setStyle(e.target.value as (typeof STYLES)[number])
              }
              disabled={isPending}
            >
              {STYLES.map((value) => (
                <option key={value} value={value}>
                  {STYLE_LABELS[value] ?? value}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Aspect ratio</span>
            <select
              value={aspectRatio}
              onChange={(e) => {
                const next = e.target.value as AspectRatio;
                setAspectRatio(next);
                const dims = ASPECT_RATIOS[next];
                setResolution(`${dims.width}x${dims.height}`);
              }}
              disabled={isPending}
            >
              {Object.keys(ASPECT_RATIOS).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Resolution</span>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              disabled={isPending}
            >
              {RESOLUTIONS.map((item) => (
                <option
                  key={item.label}
                  value={`${item.width}x${item.height}`}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error.message}
          </p>
        ) : null}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending || !prompt.trim()}
          >
            {isPending ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Generating…
              </>
            ) : (
              "Generate"
            )}
          </button>
        </div>

        {isPending ? (
          <p className="progress-note" aria-live="polite">
            Creating your image. This can take a few seconds…
          </p>
        ) : null}
      </form>

      <GenerationResult
        generation={generation}
        onRetry={() => {
          startTransition(() => {
            void generate();
          });
        }}
        onNew={onNewGeneration}
        isPending={isPending}
      />
    </div>
  );
}

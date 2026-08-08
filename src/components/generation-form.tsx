"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { downloadFilename } from "@/lib/utils";
import {
  ASPECT_RATIOS,
  RESOLUTIONS,
  STYLES,
} from "@/lib/validation/generate";
import type { GenerateApiResponse, ApiErrorResponse } from "@/types/generation";

type GenerationState = GenerateApiResponse["generation"] | null;

export function GenerationForm() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("realistic");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [resolutionIndex, setResolutionIndex] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationState>(null);

  const resolution = RESOLUTIONS[resolutionIndex];

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate an image.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          width: resolution.width,
          height: resolution.height,
          aspectRatio,
          style,
        }),
      });

      const data = (await response.json()) as
        | GenerateApiResponse
        | ApiErrorResponse;

      if (!response.ok || !data.success) {
        const message =
          "error" in data ? data.error.message : "Generation failed.";
        setError(message);
        return;
      }

      setGeneration(data.generation);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!generation?.imageUrl) return;

    try {
      const response = await fetch(generation.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename("webp");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download the image. Please try again.");
    }
  }

  function handleNewGeneration() {
    setGeneration(null);
    setError(null);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="prompt">Describe your image</Label>
          <Textarea
            id="prompt"
            placeholder="A cinematic landscape with mountains at sunset..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            aria-describedby="prompt-hint"
          />
          <p id="prompt-hint" className="text-xs text-muted-foreground">
            Be descriptive for better results. Max 2000 characters.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              disabled={loading}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("-", " ")}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aspectRatio">Aspect Ratio</Label>
            <Select
              id="aspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              disabled={loading}
            >
              {ASPECT_RATIOS.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution</Label>
            <Select
              id="resolution"
              value={resolutionIndex}
              onChange={(e) => setResolutionIndex(Number(e.target.value))}
              disabled={loading}
            >
              {RESOLUTIONS.map((r, i) => (
                <option key={r.label} value={i}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>
      </section>

      {(loading || generation) && (
        <section className="space-y-4" aria-live="polite">
          <h2 className="text-lg font-semibold">Generated Image</h2>

          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-card">
            {loading ? (
              <div className="flex h-full min-h-[300px] items-center justify-center">
                <div className="space-y-3 text-center">
                  <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Creating your image...
                  </p>
                </div>
              </div>
            ) : generation?.imageUrl ? (
              <Image
                src={generation.imageUrl}
                alt={generation.prompt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />
            ) : null}
          </div>

          {generation && !loading && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleDownload} variant="outline">
                Download
              </Button>
              <Button onClick={handleNewGeneration} variant="secondary">
                New Generation
              </Button>
              {generation.provider && (
                <span className="text-xs text-muted-foreground">
                  via {generation.provider}
                  {generation.model ? ` / ${generation.model}` : ""}
                </span>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

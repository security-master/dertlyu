"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { downloadFilename, formatDate } from "@/lib/utils";
import type { GenerationStatus } from "@/types/generation";

interface GenerationDetail {
  id: string;
  status: GenerationStatus;
  imageUrl: string | null;
  prompt: string;
  negativePrompt: string | null;
  width: number;
  height: number;
  aspectRatio: string | null;
  style: string | null;
  model: string | null;
  provider: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function GenerationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [generation, setGeneration] = useState<GenerationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGeneration() {
      try {
        const response = await fetch(`/api/generations/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.error?.message ?? "Failed to load generation details."
          );
          return;
        }

        setGeneration(data.generation);
      } catch {
        setError("Unable to load generation. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchGeneration();
  }, [id]);

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
      setError("Failed to download the image.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !generation) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error ?? "Generation not found."}
        </div>
        <Link
          href="/history"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Back to history
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/history"
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to history
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-card">
          {generation.imageUrl ? (
            <Image
              src={generation.imageUrl}
              alt={generation.prompt}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image available
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold">Generation Details</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(generation.createdAt)}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">Prompt</h2>
            <p className="rounded-md border border-border bg-card p-3 text-sm">
              {generation.prompt}
            </p>
          </div>

          {generation.negativePrompt && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Negative Prompt</h2>
              <p className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
                {generation.negativePrompt}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Dimensions</dt>
              <dd className="font-medium">
                {generation.width} × {generation.height}
              </dd>
            </div>
            {generation.aspectRatio && (
              <div>
                <dt className="text-muted-foreground">Aspect Ratio</dt>
                <dd className="font-medium">{generation.aspectRatio}</dd>
              </div>
            )}
            {generation.style && (
              <div>
                <dt className="text-muted-foreground">Style</dt>
                <dd className="font-medium">{generation.style}</dd>
              </div>
            )}
            {generation.model && (
              <div>
                <dt className="text-muted-foreground">Model</dt>
                <dd className="font-medium">{generation.model}</dd>
              </div>
            )}
            {generation.provider && (
              <div>
                <dt className="text-muted-foreground">Provider</dt>
                <dd className="font-medium">{generation.provider}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{generation.status}</dd>
            </div>
          </dl>

          {generation.imageUrl && (
            <Button onClick={handleDownload} variant="outline">
              Download Image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

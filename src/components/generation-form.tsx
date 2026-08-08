"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IMAGE_MODEL_OPTIONS, type ImageModelId } from "@/lib/constants/image-models";
import { downloadFilename } from "@/lib/utils";
import { getRandomPrompt } from "@/lib/prompts/random-prompts";
import {
  ASPECT_RATIOS,
  RESOLUTIONS,
  STYLES,
} from "@/lib/validation/generate";
import type { GenerateApiResponse, ApiErrorResponse } from "@/types/generation";

type GenerationState = GenerateApiResponse["generation"] | null;

export function GenerationForm() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ImageModelId>("turbo");
  const [style, setStyle] = useState<string>("realistic");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [resolutionIndex, setResolutionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationState>(null);

  const resolution = RESOLUTIONS[resolutionIndex];
  const selectedModel = IMAGE_MODEL_OPTIONS.find((m) => m.id === model);

  function handleRandomPrompt() {
    setPrompt(getRandomPrompt());
    setError(null);
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Lütfen bir prompt girin.");
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
          model,
        }),
      });

      const data = (await response.json()) as
        | GenerateApiResponse
        | ApiErrorResponse;

      if (!response.ok || !data.success) {
        const message =
          "error" in data ? data.error.message : "Görüntü üretilemedi.";
        setError(message);
        return;
      }

      setGeneration(data.generation);
    } catch {
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
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
      setError("Görüntü indirilemedi. Lütfen tekrar deneyin.");
    }
  }

  function handleNewGeneration() {
    setGeneration(null);
    setError(null);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Tüm modeller <strong className="text-foreground">ücretsiz</strong> —
          API anahtarı gerekmez. Turbo en hızlı seçenek.
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="prompt">Görselinizi tanımlayın</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRandomPrompt}
              disabled={loading}
              aria-label="Rastgele prompt seç"
            >
              Rastgele
            </Button>
          </div>
          <Textarea
            id="prompt"
            placeholder="Gün batımında sinematik dağ manzarası..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            aria-describedby="prompt-hint"
          />
          <p id="prompt-hint" className="text-xs text-muted-foreground">
            Detaylı açıklamalar daha iyi sonuç verir. Rastgele butonu yüzlerce
            farklı yaratıcı prompt üretir.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value as ImageModelId)}
              disabled={loading}
            >
              {IMAGE_MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.badge})
                </option>
              ))}
            </Select>
            {selectedModel && (
              <p className="text-xs text-muted-foreground">
                {selectedModel.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Stil</Label>
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
            <Label htmlFor="aspectRatio">En-boy oranı</Label>
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
            <Label htmlFor="resolution">Çözünürlük</Label>
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
                Üretiliyor...
              </>
            ) : (
              "Üret"
            )}
          </Button>
        </div>
      </section>

      {(loading || generation) && (
        <section className="space-y-4" aria-live="polite">
          <h2 className="text-lg font-semibold">Oluşturulan Görsel</h2>

          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-card">
            {loading ? (
              <div className="flex h-full min-h-[300px] items-center justify-center">
                <div className="space-y-3 text-center">
                  <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Görseliniz oluşturuluyor...
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
                İndir
              </Button>
              <Button onClick={handleNewGeneration} variant="secondary">
                Yeni Görsel
              </Button>
              {generation.model && (
                <span className="text-xs text-muted-foreground">
                  {generation.model} · ücretsiz
                </span>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

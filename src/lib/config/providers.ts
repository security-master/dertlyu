import { getEnv } from "@/lib/config/env";

export function isPollinationsConfigured(): boolean {
  return Boolean(process.env.POLLINATIONS_API_KEY?.trim());
}

export function isHuggingFaceConfigured(): boolean {
  return Boolean(process.env.HF_TOKEN?.trim());
}

export interface ProviderInfo {
  id: string;
  name: string;
  free: boolean;
  fast: boolean;
  available: boolean;
  description: string;
}

export interface ProviderStatus {
  pollinationsFree: { available: boolean };
  pollinations: { configured: boolean; available: boolean };
  huggingface: { configured: boolean; available: boolean };
  primary: string;
  fallback: string | null;
  anyAvailable: boolean;
  models: ProviderInfo[];
}

export const FREE_IMAGE_MODELS: ProviderInfo[] = [
  {
    id: "turbo",
    name: "Turbo",
    free: true,
    fast: true,
    available: true,
    description: "En hızlı — ücretsiz",
  },
  {
    id: "flux",
    name: "Flux",
    free: true,
    fast: false,
    available: true,
    description: "Yüksek kalite — ücretsiz",
  },
  {
    id: "ghibli",
    name: "Ghibli",
    free: true,
    fast: false,
    available: true,
    description: "Anime / Ghibli stili — ücretsiz",
  },
  {
    id: "dreamshaper",
    name: "DreamShaper",
    free: true,
    fast: false,
    available: true,
    description: "Sanatsal — ücretsiz",
  },
  {
    id: "kontext",
    name: "Kontext",
    free: true,
    fast: false,
    available: true,
    description: "Detaylı — ücretsiz",
  },
];

export function getProviderStatus(): ProviderStatus {
  const env = getEnv();
  const pollinationsConfigured = isPollinationsConfigured();
  const huggingfaceConfigured = isHuggingFaceConfigured();

  return {
    pollinationsFree: { available: true },
    pollinations: {
      configured: pollinationsConfigured,
      available: pollinationsConfigured,
    },
    huggingface: {
      configured: huggingfaceConfigured,
      available: huggingfaceConfigured,
    },
    primary: env.IMAGE_PROVIDER_PRIMARY,
    fallback: env.IMAGE_PROVIDER_FALLBACK ?? null,
    anyAvailable: true,
    models: FREE_IMAGE_MODELS,
  };
}

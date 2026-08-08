import { getEnv } from "@/lib/config/env";

export function isPollinationsConfigured(): boolean {
  return Boolean(process.env.POLLINATIONS_API_KEY?.trim());
}

export function isHuggingFaceConfigured(): boolean {
  return Boolean(process.env.HF_TOKEN?.trim());
}

export interface ProviderStatus {
  pollinations: { configured: boolean; available: boolean };
  huggingface: { configured: boolean; available: boolean };
  primary: string;
  fallback: string | null;
  anyAvailable: boolean;
}

export function getProviderStatus(): ProviderStatus {
  const env = getEnv();
  const pollinationsConfigured = isPollinationsConfigured();
  const huggingfaceConfigured = isHuggingFaceConfigured();

  return {
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
    anyAvailable: pollinationsConfigured || huggingfaceConfigured,
  };
}

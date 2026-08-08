export const IMAGE_MODEL_OPTIONS = [
  {
    id: "turbo",
    label: "Turbo — Hızlı",
    badge: "Ücretsiz",
    description: "En hızlı üretim (~1 sn)",
  },
  {
    id: "flux",
    label: "Flux — Kaliteli",
    badge: "Ücretsiz",
    description: "Yüksek kalite detay",
  },
  {
    id: "ghibli",
    label: "Ghibli — Anime",
    badge: "Ücretsiz",
    description: "Anime / Ghibli stili",
  },
  {
    id: "dreamshaper",
    label: "DreamShaper",
    badge: "Ücretsiz",
    description: "Sanatsal illüstrasyon",
  },
  {
    id: "kontext",
    label: "Kontext",
    badge: "Ücretsiz",
    description: "Detaylı kompozisyon",
  },
] as const;

export type ImageModelId = (typeof IMAGE_MODEL_OPTIONS)[number]["id"];

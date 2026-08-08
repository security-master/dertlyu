import { getMemoryRepository } from "./memory-repository";
import { getPostgresRepository } from "./postgres-repository";
import type { GenerationRepository } from "./types";

let override: GenerationRepository | null = null;

export function getGenerationRepository(): GenerationRepository {
  if (override) return override;
  return getPostgresRepository() ?? getMemoryRepository();
}

export function setGenerationRepositoryForTests(
  repository: GenerationRepository | null,
) {
  override = repository;
}

export type {
  GenerationRecord,
  GenerationRepository,
  CreateGenerationInput,
  UpdateGenerationInput,
} from "./types";

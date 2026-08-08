import { isDbReady } from "@/database";
import { DrizzleGenerationRepository } from "./drizzle-generation-repository";
import { InMemoryGenerationRepository } from "./in-memory-generation-repository";
import type { GenerationRepository } from "./generation-repository";

let repositoryInstance: GenerationRepository | null = null;

export function getGenerationRepository(): GenerationRepository {
  if (!repositoryInstance) {
    repositoryInstance = isDbReady()
      ? new DrizzleGenerationRepository()
      : new InMemoryGenerationRepository();
  }
  return repositoryInstance;
}

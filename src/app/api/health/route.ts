import { describeProviderAvailability } from "@/lib/config/env";

export const runtime = "nodejs";

export async function GET() {
  const availability = describeProviderAvailability();
  return Response.json({
    ok: true,
    providers: {
      pollinations: availability.pollinations,
      huggingface: availability.huggingface,
    },
    storage: availability.storage,
    database: availability.database ? "configured" : "memory",
  });
}

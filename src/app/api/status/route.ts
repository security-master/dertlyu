import { getProviderStatus } from "@/lib/config/providers";
import { jsonResponse } from "@/lib/api/response";

export async function GET() {
  const status = getProviderStatus();

  return jsonResponse({
    success: true,
    providers: status,
    message: status.anyAvailable
      ? "At least one image provider is configured."
      : "No image providers are configured. Set POLLINATIONS_API_KEY or HF_TOKEN on the server.",
  });
}

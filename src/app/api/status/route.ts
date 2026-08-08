import { getProviderStatus } from "@/lib/config/providers";
import { jsonResponse } from "@/lib/api/response";

export async function GET() {
  const status = getProviderStatus();

  return jsonResponse({
    success: true,
    providers: status,
    message: "Ücretsiz görüntü üretimi hazır. API anahtarı gerekmez.",
  });
}

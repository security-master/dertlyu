import { getImageStorage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await context.params;
  const key = parts.join("/");

  if (
    !key ||
    key.includes("..") ||
    key.length > 512 ||
    !/^generations\/[A-Za-z0-9_./-]+$/.test(key)
  ) {
    return new Response("Not found", { status: 404 });
  }

  const stored = await getImageStorage().get(key);
  if (!stored) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(stored.data), {
    status: 200,
    headers: {
      "Content-Type": stored.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

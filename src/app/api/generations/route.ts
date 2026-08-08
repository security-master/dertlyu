import { requireUser } from "@/lib/auth/session";
import { toAppError } from "@/lib/errors/app-error";
import {
  listGenerationsForUser,
  toPublicGeneration,
} from "@/lib/generation/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "48"), 100);
    const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);
    const rows = await listGenerationsForUser(user.id, { limit, offset });
    return Response.json({
      success: true,
      data: rows.map(toPublicGeneration),
    });
  } catch (error) {
    const appError = toAppError(error);
    return Response.json(appError.toJSON(), { status: appError.status });
  }
}

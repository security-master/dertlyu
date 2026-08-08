import { requireUser } from "@/lib/auth/session";
import { toAppError } from "@/lib/errors/app-error";
import {
  getGenerationForUser,
  toPublicGeneration,
} from "@/lib/generation/service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    const generation = await getGenerationForUser(id, user.id);
    return Response.json({
      success: true,
      data: toPublicGeneration(generation),
    });
  } catch (error) {
    const appError = toAppError(error);
    return Response.json(appError.toJSON(), { status: appError.status });
  }
}

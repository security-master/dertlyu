import { describe, it, expect } from "vitest";
import { AppError, ERROR_MESSAGES } from "@/lib/errors/app-error";

describe("AppError", () => {
  it("normalizes error responses", () => {
    const error = new AppError("RATE_LIMITED");
    const json = error.toJSON();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe("RATE_LIMITED");
    expect(json.error.message).toBe(ERROR_MESSAGES.RATE_LIMITED);
  });

  it("does not expose internal details in JSON", () => {
    const error = new AppError("INTERNAL_ERROR", "secret api key leaked");
    const json = error.toJSON();

    expect(json.error.message).toBe("secret api key leaked");
    expect(JSON.stringify(json)).not.toContain("API_KEY");
  });
});

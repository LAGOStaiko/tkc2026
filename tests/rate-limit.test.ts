import { describe, expect, it } from "vitest";
import { buildRateLimitConfig } from "../functions/_lib/rate-limit";

describe("rate-limit defaults", () => {
  it("keeps register defaults at 10 minutes / 30 when env is missing", () => {
    const config = buildRateLimitConfig(
      {},
      {
        prefix: "register:rate-limit",
        defaultWindowMs: 10 * 60 * 1000,
        defaultMax: 30,
      }
    );

    expect(config.windowMs).toBe(600_000);
    expect(config.max).toBe(30);
  });

  it("uses fallback defaults when env values are blank strings", () => {
    const config = buildRateLimitConfig(
      {
        RATE_LIMIT_WINDOW_MS: "   ",
        RATE_LIMIT_MAX: "",
      },
      {
        prefix: "register:rate-limit",
        defaultWindowMs: 10 * 60 * 1000,
        defaultMax: 30,
      }
    );

    expect(config.windowMs).toBe(600_000);
    expect(config.max).toBe(30);
  });
});

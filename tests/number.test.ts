import { describe, expect, it } from "vitest";
import { resolveGasNetworkConfig } from "../functions/_lib/gas";
import { parseBoundedInt } from "../functions/_lib/number";

describe("parseBoundedInt", () => {
  it("uses fallback when input is undefined", () => {
    expect(parseBoundedInt(undefined, 120_000, 1, 300_000)).toBe(120_000);
  });

  it("uses fallback when input is empty string", () => {
    expect(parseBoundedInt("", 120_000, 1, 300_000)).toBe(120_000);
  });

  it("uses fallback when input is whitespace string", () => {
    expect(parseBoundedInt("   ", 120_000, 1, 300_000)).toBe(120_000);
  });

  it("clamps to min for zero string", () => {
    expect(parseBoundedInt("0", 120_000, 1, 300_000)).toBe(1);
  });

  it("clamps to max for too large number", () => {
    expect(parseBoundedInt("999999", 120_000, 1, 1_000)).toBe(1_000);
  });

  it("accepts bounded numeric values", () => {
    expect(parseBoundedInt("120000", 60_000, 1, 300_000)).toBe(120_000);
  });
});

describe("resolveGasNetworkConfig", () => {
  it("keeps default timeout and retries when env is missing", () => {
    const config = resolveGasNetworkConfig(
      {
        GAS_API_KEY: "test",
      },
      "site"
    );

    expect(config.timeoutMs).toBe(12_000);
    expect(config.readRetries).toBe(1);
    expect(config.maxRetries).toBe(1);
  });
});

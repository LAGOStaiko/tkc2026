import { describe, expect, it } from "vitest";
import { registerSchema } from "../functions/api/register";
import { REGISTER_LIMITS as L } from "../shared/register-limits";

// Uses the real server schema — no duplicated definition.
// Console base requires videoLink; arcade base requires dohirobaNo, region, offlineSongs.
const consoleBase = {
  division: "console",
  name: "홍길동",
  phone: "010-1234-5678",
  email: "test@example.com",
  nickname: "tester",
  namcoId: "TEST123",
  videoLink: "https://youtu.be/abc123",
  spectator: false,
  isMinor: false,
  privacyAgree: true,
};

const arcadeBase = {
  division: "arcade",
  name: "홍길동",
  phone: "010-1234-5678",
  email: "test@example.com",
  nickname: "tester",
  namcoId: "TEST123",
  dohirobaNo: "12345",
  qualifierRegion: "서울",
  offlineSongs: ["곡A", "곡B", "곡C", "곡D"],
  spectator: false,
  isMinor: false,
  privacyAgree: true,
};

describe("register schema — field length limits", () => {
  it("accepts console values within limits", () => {
    expect(registerSchema.safeParse(consoleBase).success).toBe(true);
  });

  it("accepts arcade values within limits", () => {
    expect(registerSchema.safeParse(arcadeBase).success).toBe(true);
  });

  it("rejects name exceeding max length", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      name: "가".repeat(L.name + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone exceeding max length", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      phone: "1".repeat(L.phone + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects nickname exceeding max length", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      nickname: "a".repeat(L.nickname + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects namcoId exceeding max length", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      namcoId: "X".repeat(L.namcoId + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects videoLink exceeding max length", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      videoLink: "https://example.com/" + "a".repeat(L.videoLink),
    });
    expect(result.success).toBe(false);
  });

  it("rejects offlineSong item exceeding max length", () => {
    const result = registerSchema.safeParse({
      ...arcadeBase,
      offlineSongs: ["a".repeat(L.offlineSong + 1), "b", "c", "d"],
    });
    expect(result.success).toBe(false);
  });
});

describe("register schema — shared limits consistency", () => {
  it("REGISTER_LIMITS values are all positive integers", () => {
    for (const [key, val] of Object.entries(L)) {
      expect(val, `${key} should be positive`).toBeGreaterThan(0);
      expect(Number.isInteger(val), `${key} should be integer`).toBe(true);
    }
  });
});

describe("register schema — URL validation", () => {
  it("accepts valid https videoLink", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      videoLink: "https://youtu.be/abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects http videoLink", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      videoLink: "http://youtu.be/abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects javascript: videoLink", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      videoLink: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("rejects data: videoLink", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      videoLink: "data:text/html,<script>alert(1)</script>",
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace around videoLink before validation", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      videoLink: "  https://youtu.be/abc123  ",
    });
    expect(result.success).toBe(true);
  });

  it("treats empty videoLink as valid (arcade, optional field)", () => {
    const result = registerSchema.safeParse({
      ...arcadeBase,
      videoLink: "",
    });
    expect(result.success).toBe(true);
  });

  it("treats whitespace-only videoLink as valid (arcade, trims to empty)", () => {
    const result = registerSchema.safeParse({
      ...arcadeBase,
      videoLink: "   ",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid https consentLink", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      isMinor: true,
      consentLink: "https://drive.google.com/file/d/abc",
    });
    expect(result.success).toBe(true);
  });

  it("rejects http consentLink", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      isMinor: true,
      consentLink: "http://example.com/consent.pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL format for consentLink", () => {
    const result = registerSchema.safeParse({
      ...consoleBase,
      isMinor: true,
      consentLink: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

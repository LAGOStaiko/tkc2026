import { describe, expect, it } from "vitest";
import { escapeFormulaField } from "../functions/_lib/sanitize";

describe("escapeFormulaField", () => {
  it("prepends apostrophe for = prefix", () => {
    expect(escapeFormulaField("=SUM(A1)")).toBe("'=SUM(A1)");
  });

  it("prepends apostrophe for + prefix", () => {
    expect(escapeFormulaField("+1234")).toBe("'+1234");
  });

  it("prepends apostrophe for - prefix", () => {
    expect(escapeFormulaField("-B2")).toBe("'-B2");
  });

  it("prepends apostrophe for @ prefix", () => {
    expect(escapeFormulaField("@mention")).toBe("'@mention");
  });

  it("does not escape normal text", () => {
    expect(escapeFormulaField("hello")).toBe("hello");
  });

  it("trims whitespace before checking prefix", () => {
    expect(escapeFormulaField("  =SUM(A1)  ")).toBe("'=SUM(A1)");
  });

  it("returns empty string for empty input", () => {
    expect(escapeFormulaField("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(escapeFormulaField("   ")).toBe("");
  });

  it("handles non-string input (number)", () => {
    expect(escapeFormulaField(42)).toBe("42");
  });

  it("handles non-string input (null)", () => {
    expect(escapeFormulaField(null)).toBe("");
  });

  it("handles non-string input (undefined)", () => {
    expect(escapeFormulaField(undefined)).toBe("");
  });

  it("does not double-escape already escaped values", () => {
    expect(escapeFormulaField("'=SUM(A1)")).toBe("'=SUM(A1)");
  });

  it("handles strings starting with numbers safely", () => {
    expect(escapeFormulaField("123abc")).toBe("123abc");
  });
});

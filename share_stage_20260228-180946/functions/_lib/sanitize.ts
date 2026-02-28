/**
 * Prevents spreadsheet formula injection.
 * If a string starts with =, +, -, or @, prepend an apostrophe.
 * The apostrophe is a standard "text prefix" in spreadsheet apps
 * and will not appear in the cell's displayed value.
 */
const FORMULA_PREFIXES = ["=", "+", "-", "@"];

export function escapeFormulaField(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "");
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (FORMULA_PREFIXES.some((p) => trimmed.startsWith(p))) {
    return "'" + trimmed;
  }
  return trimmed;
}

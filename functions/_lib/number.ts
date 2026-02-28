export function parseBoundedInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number
) {
  const normalized =
    typeof value === "string" ? value.trim() : value;

  if (
    normalized === undefined ||
    normalized === null ||
    normalized === ""
  ) {
    return fallback;
  }

  const raw =
    typeof normalized === "number"
      ? normalized
      : Number(String(normalized));
  if (!Number.isFinite(raw)) return fallback;

  const rounded = Math.floor(raw);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

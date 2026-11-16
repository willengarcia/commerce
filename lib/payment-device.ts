/** Accept only a bounded, header-safe SDK identifier; never invent a fallback. */
export function normalizeDeviceSessionId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const id = value.trim();
  return id.length > 0 && id.length <= 1024 && /^[\x21-\x7e]+$/.test(id)
    ? id
    : undefined;
}

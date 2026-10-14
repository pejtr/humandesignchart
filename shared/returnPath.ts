const MAX_RETURN_PATH_LENGTH = 512;

/**
 * Accepts only a same-origin absolute path ("/cs/honorace?checkout=1").
 * Anything that a browser could resolve to another origin ("//evil.com",
 * "/\\evil.com", "https://…") or that points back at the login flow is
 * rejected, so the value is safe to use in a post-login redirect.
 */
export function sanitizeReturnPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.length === 0 || value.length > MAX_RETURN_PATH_LENGTH) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  // Control characters and backslashes have no place in our routes and are
  // a common way to confuse URL parsers.
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f || code === 0x5c) return null;
  }
  const pathname = value.split(/[?#]/, 1)[0];
  if (pathname.startsWith("/api/") || /^\/(?:[a-z]{2}\/)?login\/?$/.test(pathname)) return null;
  return value;
}

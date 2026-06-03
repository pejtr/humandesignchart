/**
 * Prompt Injection Prevention Module
 *
 * Provides two layers of protection:
 *  1. sanitizeInput() — strips known injection patterns and enforces max length
 *  2. checkRateLimit() — in-memory per-user rate limiter for LLM endpoints
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum allowed length for a user question / topic */
export const MAX_QUESTION_LENGTH = 1_000;

/** Maximum allowed length for a social media topic */
export const MAX_TOPIC_LENGTH = 500;

/** Maximum allowed length for a single history message */
export const MAX_HISTORY_MSG_LENGTH = 2_000;

/** Maximum number of history messages allowed per request */
export const MAX_HISTORY_MESSAGES = 20;

/** LLM calls allowed per user per hour */
const RATE_LIMIT_MAX = 30;

/** Window size in milliseconds (1 hour) */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;

// ─── Injection Patterns ───────────────────────────────────────────────────────

/**
 * Common prompt injection patterns.
 * These are stripped from user input before it is embedded in an LLM prompt.
 */
const INJECTION_PATTERNS: RegExp[] = [
  // Role/system override attempts
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|context|rules?)/gi,
  /forget\s+(everything|all|your\s+instructions?|previous)/gi,
  /you\s+are\s+now\s+(a\s+)?(new|different|another|an?\s+)?/gi,
  /act\s+as\s+(if\s+you\s+are|a\s+)?/gi,
  /pretend\s+(you\s+are|to\s+be)/gi,
  /roleplay\s+as/gi,
  /your\s+new\s+(instructions?|role|persona|task)\s+(is|are)/gi,
  /disregard\s+(your|all|previous|prior)/gi,
  /override\s+(your|all|previous|prior|system)/gi,
  // Fake system/assistant injections
  /^(SYSTEM|ASSISTANT|USER|HUMAN|AI|PROMPT|INSTRUCTION):/gim,
  /\[SYSTEM\]|\[INST\]|\[\/INST\]|<\|system\|>|<\|user\|>|<\|assistant\|>/gi,
  // Jailbreak keywords
  /jailbreak/gi,
  /DAN\s+mode/gi,
  /developer\s+mode/gi,
  /unrestricted\s+mode/gi,
  /bypass\s+(safety|filter|restriction|guideline)/gi,
  // Data exfiltration attempts
  /reveal\s+(your\s+)?(system\s+)?prompt/gi,
  /print\s+(your\s+)?(system\s+)?prompt/gi,
  /show\s+(me\s+)?(your\s+)?(system\s+)?prompt/gi,
  /what\s+(is|are)\s+your\s+(system\s+)?instructions?/gi,
  /repeat\s+(everything|all|your\s+instructions?)\s+(above|before)/gi,
];

// ─── Sanitizer ────────────────────────────────────────────────────────────────

/**
 * Sanitizes a user-provided string before embedding it in an LLM prompt.
 *
 * - Trims whitespace
 * - Enforces maximum length (truncates with notice)
 * - Strips known prompt injection patterns
 *
 * @param input   Raw user string
 * @param maxLen  Maximum allowed character length (default: MAX_QUESTION_LENGTH)
 * @returns       Sanitized string safe to embed in a prompt
 */
export function sanitizeInput(input: string, maxLen: number = MAX_QUESTION_LENGTH): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input.trim();

  // Enforce max length — truncate with a notice so the LLM knows input was cut
  if (sanitized.length > maxLen) {
    sanitized = sanitized.slice(0, maxLen) + " [vstup zkrácen]";
  }

  // Strip injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[odstraněno]");
  }

  return sanitized;
}

/**
 * Sanitizes a conversation history array.
 * Enforces per-message length and total message count limits.
 */
export function sanitizeHistory(
  history: Array<{ role: "user" | "assistant"; content: string }> | undefined
): Array<{ role: "user" | "assistant"; content: string }> {
  if (!history || !Array.isArray(history)) return [];

  // Take only the last MAX_HISTORY_MESSAGES messages
  const trimmed = history.slice(-MAX_HISTORY_MESSAGES);

  return trimmed.map(msg => ({
    role: msg.role,
    content: sanitizeInput(msg.content, MAX_HISTORY_MSG_LENGTH),
  }));
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/** In-memory store: userId → { count, windowStart } */
const rateLimitStore = new Map<number, RateLimitEntry>();

/**
 * Checks whether a user has exceeded the LLM rate limit.
 *
 * @param userId  Authenticated user ID
 * @returns       `{ allowed: true }` if within limit, or `{ allowed: false, retryAfterMs }` if exceeded
 */
export function checkRateLimit(userId: number): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true };
}

/**
 * Resets the rate limit for a user (useful in tests).
 */
export function resetRateLimit(userId: number): void {
  rateLimitStore.delete(userId);
}

/**
 * Returns current rate limit stats for a user (useful in tests / monitoring).
 */
export function getRateLimitStats(userId: number): { count: number; windowStart: number } | null {
  return rateLimitStore.get(userId) ?? null;
}

/**
 * Database Access Layer — Aggregates all domain-specific DB operations.
 * 
 * Each module is defined in `server/db/`.
 */
export * from "./db/index";
export * from "./db/users";
export * from "./db/charts";
export * from "./db/readings";
export * from "./db/referrals";
export * from "./db/gamification";
export * from "./db/affiliates";
export * from "./db/chat";

// Re-export specific logic that might be used elsewhere
export { calculateUserLevel } from "./db/gamification";

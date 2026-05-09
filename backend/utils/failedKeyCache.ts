/**
 * Failed API Key Cache
 *
 * In-memory cache backed by Prisma DB to track rate-limited Gemini API keys.
 * Failed keys are excluded from selection for 24 hours.
 *
 * - Hot path (isKeyFailed / getAvailableKeys): O(1) in-memory, zero DB latency
 * - Cold path (markKeyFailed): async DB upsert, non-blocking
 * - Startup: loads unexpired entries from DB into memory
 * - Cleanup: hourly interval removes expired entries
 */

import crypto from "crypto";
import prisma from "@/lib/db";

// ── In-memory store: keyHash → expiresAt ──────────────────────────────
const failedKeys = new Map<string, Date>();

// ── Helpers ───────────────────────────────────────────────────────────
function hashKey(apiKey: string): string {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Get the next 1:30 PM IST (08:00 UTC / 00:00 PST) reset time.
 * If we're already past 08:00 UTC today, returns tomorrow's 08:00 UTC.
 */
function getNextResetTime(): Date {
    const now = new Date();
    const reset = new Date(now);
    reset.setUTCHours(8, 0, 0, 0); // 08:00 UTC = 1:30 PM IST = 00:00 PST
    if (reset <= now) {
        reset.setUTCDate(reset.getUTCDate() + 1);
    }
    return reset;
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Check if a key is currently marked as failed (in-memory, O(1)).
 */
export function isKeyFailed(apiKey: string): boolean {
    const h = hashKey(apiKey);
    const expiresAt = failedKeys.get(h);
    if (!expiresAt) return false;
    if (expiresAt <= new Date()) {
        // Expired – clean it up
        failedKeys.delete(h);
        return false;
    }
    return true;
}

/**
 * Return only the keys that are NOT currently failed.
 */
export function getAvailableKeys(allKeys: string[]): string[] {
    return allKeys.filter((k) => !isKeyFailed(k));
}

/**
 * Mark a key as failed for 24 hours.
 * Updates in-memory cache immediately, then persists to DB async.
 */
export async function markKeyFailed(
    apiKey: string,
    reason?: string
): Promise<void> {
    const h = hashKey(apiKey);
    const now = new Date();
    const expiresAt = getNextResetTime();

    // Update in-memory immediately (zero latency for subsequent checks)
    failedKeys.set(h, expiresAt);

    // Persist to DB (fire-and-forget style, but we await to catch errors)
    try {
        await prisma.failedApiKey.upsert({
            where: { keyHash: h },
            update: {
                reason: reason?.slice(0, 500),
                failedAt: now,
                expiresAt,
            },
            create: {
                keyHash: h,
                reason: reason?.slice(0, 500),
                failedAt: now,
                expiresAt,
            },
        });
        console.log(`[FailedKeyCache] Marked key as failed for 24h (hash: ${h.slice(0, 8)}...)`);
    } catch (err: unknown) {
        console.error(`[FailedKeyCache] DB upsert failed:`, (err as Error).message);
        // In-memory cache still holds the entry, so the key stays excluded
    }
}

/**
 * Load all unexpired failed keys from DB into memory.
 * Called once at module init / server startup.
 */
export async function loadFailedKeysFromDB(): Promise<void> {
    try {
        const entries = await prisma.failedApiKey.findMany({
            where: { expiresAt: { gt: new Date() } },
        });
        for (const entry of entries) {
            failedKeys.set(entry.keyHash, entry.expiresAt);
        }
        if (entries.length > 0) {
            console.log(
                `[FailedKeyCache] Loaded ${entries.length} failed key(s) from DB`
            );
        }
    } catch (err: unknown) {
        console.error(`[FailedKeyCache] Failed to load from DB:`, (err as Error).message);
    }
}

/**
 * Remove expired entries from both in-memory cache and DB.
 */
async function cleanupExpiredKeys(): Promise<void> {
    // In-memory cleanup
    const now = new Date();
    for (const [hash, expiresAt] of failedKeys.entries()) {
        if (expiresAt <= now) {
            failedKeys.delete(hash);
        }
    }

    // DB cleanup
    try {
        const { count } = await prisma.failedApiKey.deleteMany({
            where: { expiresAt: { lte: now } },
        });
        if (count > 0) {
            console.log(`[FailedKeyCache] Cleaned up ${count} expired key(s) from DB`);
        }
    } catch (err: unknown) {
        console.error(`[FailedKeyCache] DB cleanup failed:`, (err as Error).message);
    }
}

// ── Initialization ────────────────────────────────────────────────────
// Load from DB on module import
loadFailedKeysFromDB();

// Cleanup expired keys every hour
setInterval(cleanupExpiredKeys, 60 * 60 * 1000);

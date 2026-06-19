import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
    console.log("[Database] getDb called, DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);
    if (!_db && process.env.DATABASE_URL) {
        try {
            _db = drizzle(process.env.DATABASE_URL);
        } catch (error) {
            console.warn("[Database] Failed to connect:", error);
            _db = null;
        }
    }
    return _db;
}

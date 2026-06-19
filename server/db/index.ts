import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

let _db: any = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
    if (!_db && process.env.DATABASE_URL) {
        try {
            console.log("[Database] Initializing connection pool...");
            _pool = mysql.createPool(process.env.DATABASE_URL);
            _db = drizzle(_pool);
        } catch (error) {
            console.error("[Database] Failed to initialize pool:", error);
            _db = null;
        }
    }
    return _db;
}

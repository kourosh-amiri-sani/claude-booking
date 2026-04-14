import { createClient, type Client } from "@libsql/client";
import bcrypt from "bcryptjs";

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || (process.env.VERCEL ? "file:/tmp/booking.db" : "file:data/booking.db"),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDb() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      work_type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migrate: add work_type column if it doesn't exist
  try {
    await db.execute("ALTER TABLE bookings ADD COLUMN work_type TEXT NOT NULL DEFAULT ''");
  } catch {
    // Column already exists
  }

  // Seed default admin if no users exist
  const result = await db.execute("SELECT COUNT(*) as count FROM users");
  if (Number(result.rows[0].count) === 0) {
    const hashedPassword = await bcrypt.hash("admin", 10);
    await db.execute({
      sql: "INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)",
      args: ["admin", hashedPassword],
    });
  }
}

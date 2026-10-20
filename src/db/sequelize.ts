import { Sequelize } from "sequelize";
import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DB_PATH || "./data/database.sqlite";

// In-memory DB (":memory:") is used by tests; otherwise ensure the folder exists.
if (dbPath !== ":memory:") {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Only the connection below is SQLite-specific. Switching to PostgreSQL later
// is a one-line change: set dialect: "postgres" and pass a connection string
// (e.g. via DATABASE_URL) instead of `storage`.
export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: false,
});

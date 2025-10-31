// db.js
import pkg from "pg";
const { Pool } = pkg;

const isLocal = process.env.NODE_ENV !== "production";

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: isLocal
    ? false
    : {
        rejectUnauthorized: false,
      },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000, // force refresh idle connections
  max: 10, // limit open connections to prevent exhaustion
});

// 🩵 Reconnect logic for Render sleeping containers
pool.on("error", (err) => {
  console.error("Postgres pool error → reconnecting:", err.message);
});

export default pool;

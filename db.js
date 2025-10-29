// db.js
import pkg from "pg";
const { Pool } = pkg;

// Automatically detect environment (Render or Local)
const isLocal = process.env.NODE_ENV !== "production";

// 🔒 SSL only in production (Render/Supabase)
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: isLocal
    ? false
    : {
        rejectUnauthorized: false,
      },
});

export default pool;

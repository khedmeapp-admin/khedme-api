// test-db.js
import dotenv from "dotenv";
import pg from "pg";
dotenv.config();

const { Pool } = pg;

// ✅ Use SSL required for Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully!");
    const { rows } = await client.query("SELECT NOW()");
    console.log("🕒 Current DB time:", rows[0].now);
    client.release();
    await pool.end();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

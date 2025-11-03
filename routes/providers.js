// routes/providers.js
import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ✅ PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase")
    ? { rejectUnauthorized: false }
    : false,
});

/* ---------------------------------------------------
   ✅ GET all providers (for testing/admin)
--------------------------------------------------- */
router.get("/all", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM providers ORDER BY id ASC");
    res.json({ success: true, providers: rows });
  } catch (error) {
    console.error("❌ Error fetching providers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Toggle Provider Availability (FINAL WORKING)
--------------------------------------------------- */
router.post("/availability", async (req, res) => {
  try {
    const { provider_id, is_available } = req.body;

    if (!provider_id || typeof is_available !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid provider_id / is_available",
      });
    }

    console.log("🔍 Incoming data:", { provider_id, is_available });

    const result = await pool.query(
      `UPDATE providers 
       SET available = $1 
       WHERE id = $2 
       RETURNING id, full_name, phone, available;`,
      [is_available, provider_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    res.json({
      success: true,
      message: `Availability updated to ${
        is_available ? "Available ✅" : "Unavailable ❌"
      }`,
      provider: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating availability:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating availability",
      error: error.message,
    });
  }
});

export default router;

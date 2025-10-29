// routes/meta.js
import express from "express";
const router = express.Router();

/* -----------------------------
   ✅ GET all categories
----------------------------- */
router.get("/categories", async (req, res) => {
  const pool = req.pool;
  try {
    const { rows } = await pool.query(
      "SELECT id, name, name_ar, branch FROM categories ORDER BY id"
    );
    res.json({ success: true, categories: rows });
  } catch (error) {
    console.error("❌ Error fetching categories:", error.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/* -----------------------------
   ✅ GET all districts
----------------------------- */
router.get("/districts", async (req, res) => {
  const pool = req.pool;
  try {
    const { rows } = await pool.query(
      "SELECT id, name, name_ar FROM districts ORDER BY id"
    );
    res.json({ success: true, districts: rows });
  } catch (error) {
    console.error("❌ Error fetching districts:", error.message);
    res.status(500).json({ error: "Failed to fetch districts" });
  }
});

export default router;

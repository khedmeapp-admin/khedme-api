import express from "express";
const router = express.Router();

/* ---------------------------------------------------
   ✅ Get all categories
--------------------------------------------------- */
router.get("/categories", async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      "SELECT id, name_en, name_ar, branch FROM categories ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching categories:", error.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/* ---------------------------------------------------
   ✅ Get all districts
--------------------------------------------------- */
router.get("/districts", async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      "SELECT id, name_en, name_ar FROM districts ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching districts:", error.message);
    res.status(500).json({ error: "Failed to fetch districts" });
  }
});

export default router;

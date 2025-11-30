// routes/meta.js
import express from "express";

const router = express.Router();

// GET /api/meta
router.get("/", async (req, res) => {
  const pool = req.app.get("pool");

  try {
    // Fetch districts
    const districtsRes = await pool.query(
      `SELECT id, name, name_ar FROM districts ORDER BY name`
    );
    const districts = districtsRes.rows;

    // Fetch categories
    const categoriesRes = await pool.query(
      `SELECT id, name, name_ar FROM categories ORDER BY name`
    );
    const categories = categoriesRes.rows;

    res.json({ success: true, districts, categories });
  } catch (err) {
    console.error("❌ Fetch meta data error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch meta data" });
  }
});

export default router;

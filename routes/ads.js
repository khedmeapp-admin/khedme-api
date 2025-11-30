// routes/ads.js
import express from "express";
const router = express.Router();

// GET /api/ads
// Returns top and bottom ads for main page
router.get("/", async (req, res) => {
  try {
    const pool = req.app.get("pool");

    // Fetch top ad
    const topResult = await pool.query(
      `SELECT id, content, position FROM ads WHERE position = 'top' ORDER BY created_at DESC LIMIT 1`
    );
    const topAd = topResult.rows[0] || null;

    // Fetch bottom ad
    const bottomResult = await pool.query(
      `SELECT id, content, position FROM ads WHERE position = 'bottom' ORDER BY created_at DESC LIMIT 1`
    );
    const bottomAd = bottomResult.rows[0] || null;

    res.json({
      success: true,
      top: topAd,
      bottom: bottomAd,
    });
  } catch (err) {
    console.error("Failed to fetch ads:", err);
    res.status(500).json({ success: false, message: "Failed to fetch ads" });
  }
});

export default router;

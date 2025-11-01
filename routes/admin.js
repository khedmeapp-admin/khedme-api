// D:\Khedme\Khedme-api\routes\admin.js
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// ---------------------------------------------------
// 🔐 Admin Login (static credentials for now)
// ---------------------------------------------------
const ADMIN_EMAIL = "admin@khedme.com";
const ADMIN_PASSWORD = "123456";
const JWT_SECRET = "supersecretkey123";

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, {
      expiresIn: "2h",
    });
    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid admin credentials" });
});

// ---------------------------------------------------
// 📊 Admin Stats — Jobs & Providers Overview
// ---------------------------------------------------
router.get("/stats", async (req, res) => {
  try {
    // ✅ Use pool from request (attached in index.js)
    const pool = req.pool;

    const [jobsRes, pendingRes, totalProvidersRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM jobs"),
      pool.query("SELECT COUNT(*) FROM providers WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM providers"),
    ]);

    const stats = {
      totalJobs: Number(jobsRes.rows[0].count),
      pendingProviders: Number(pendingRes.rows[0].count),
      totalProviders: Number(totalProvidersRes.rows[0].count),
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin stats ❌",
      error: error.message,
    });
  }
});

export default router;

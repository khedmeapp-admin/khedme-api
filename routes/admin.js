// backend/routes/admin.js – admin dashboard data + provider approval (zero raw keys)
import express from "express";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/* ---------- helpers ---------- */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
  next();
};

/* ---------- users ---------- */
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  const { rows } = await pool.query(
    "SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC"
  );
  res.json({ success: true, users: rows });
});

router.delete("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
  res.json({ success: true, message: "User deleted" });
});

/* ---------- jobs ---------- */
router.get("/jobs", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  const { rows } = await pool.query(`
    SELECT j.id, j.title, j.price, j.currency, j.status, j.created_at,
           u.full_name as client_name
    FROM jobs j
    JOIN users u ON j.client_id = u.id
    ORDER BY j.created_at DESC
  `);
  res.json({ success: true, jobs: rows });
});

/* ---------- disputes ---------- */
router.get("/disputes", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  const { rows } = await pool.query(`
    SELECT d.id, d.reason, d.status, d.created_at,
           u1.full_name as complainant_name,
           u2.full_name as defendant_name
    FROM disputes d
    JOIN users u1 ON d.complainant_id = u1.id
    JOIN users u2 ON d.defendant_id = u2.id
    ORDER BY d.created_at DESC
  `);
  res.json({ success: true, disputes: rows });
});

/* ---------- providers (pending) ---------- */
router.get("/providers", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  const { rows } = await pool.query(`
    SELECT p.id, p.status, p.created_at, u.full_name, u.email, u.district
    FROM providers p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `);
  res.json({ success: true, providers: rows });
});

router.post("/approve-provider", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  const { providerId } = req.body;
  await pool.query("UPDATE providers SET status = 'approved' WHERE id = $1", [providerId]);
  res.json({ success: true });
});

router.post("/reject-provider", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  const { providerId } = req.body;
  await pool.query("UPDATE providers SET status = 'rejected' WHERE id = $1", [providerId]);
  res.json({ success: true });
});

/* ---------- ads (keep existing) ---------- */
router.get("/ads", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  const { rows } = await pool.query("SELECT * FROM ads ORDER BY created_at DESC");
  res.json({ success: true, ads: rows });
});

router.post("/ads", authMiddleware, adminOnly, async (req, res) => {
  const { title, image_url, link_url, start_date, end_date } = req.body;
  const pool = req.app.get("pool");
  const { rows } = await pool.query(
    "INSERT INTO ads (title, image_url, link_url, start_date, end_date) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [title, image_url, link_url, start_date, end_date]
  );
  res.json({ success: true, ad: rows[0] });
});

router.put("/ads/:id", authMiddleware, adminOnly, async (req, res) => {
  const { title, image_url, link_url, start_date, end_date } = req.body;
  const pool = req.app.get("pool");
  const { rows } = await pool.query(
    `UPDATE ads SET title=$1, image_url=$2, link_url=$3, start_date=$4, end_date=$5 WHERE id=$6 RETURNING *`,
    [title, image_url, link_url, start_date, end_date, req.params.id]
  );
  res.json({ success: true, ad: rows[0] });
});

router.delete("/ads/:id", authMiddleware, adminOnly, async (req, res) => {
  const pool = req.app.get("pool");
  await pool.query("DELETE FROM ads WHERE id = $1", [req.params.id]);
  res.json({ success: true, message: "Ad deleted" });
});

export default router;
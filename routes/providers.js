// backend/routes/providers.js – global accounts: any user can activate/deactivate provider profile
import express from "express";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ---------------------------------------------
// GET /api/providers/me – return provider row or 404 (global user)
// ---------------------------------------------
router.get("/me", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");
  const row = await pool.query(
    "SELECT id, bio, rate FROM providers WHERE user_id = $1",
    [req.user.id]
  );
  if (!row.rows.length) return res.status(404).json({ id: null });
  res.json(row.rows[0]);
});

// ---------------------------------------------
// POST /api/providers/activate – create provider row (global user)
// ---------------------------------------------
router.post("/activate", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");
  const exists = await pool.query(
    "SELECT id FROM providers WHERE user_id = $1",
    [req.user.id]
  );
  if (exists.rows.length) return res.status(200).json({ id: exists.rows[0].id });

  const insert = await pool.query(
    "INSERT INTO providers (user_id, bio, rate) VALUES ($1, $2, $3) RETURNING id",
    [req.user.id, "", 0]
  );
  res.status(201).json({ id: insert.rows[0].id });
});

// ---------------------------------------------
// POST /api/providers/deactivate – soft-delete provider row (global user)
// ---------------------------------------------
router.post("/deactivate", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");
  await pool.query("DELETE FROM providers WHERE user_id = $1", [req.user.id]);
  res.status(204).send();
});

// ---------------------------------------------
// ADMIN ROUTES (unchanged)
// ---------------------------------------------
// GET /api/providers/pending
router.get("/pending", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");
  if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email, phone, created_at FROM providers WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json({ success: true, providers: rows });
  } catch (err) {
    console.error("Error fetching pending providers:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/providers/approve
router.post("/approve", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");
  if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ message: "providerId is required" });
  try {
    const result = await pool.query(
      "UPDATE providers SET status = 'approved' WHERE id = $1 RETURNING id, full_name, status",
      [providerId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Provider not found" });
    res.json({ success: true, provider: result.rows[0] });
  } catch (err) {
    console.error("Error approving provider:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/providers/reject
router.post("/reject", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");
  if (req.user.role !== "admin") return res.status(403).json({ message: "Unauthorized" });
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ message: "providerId is required" });
  try {
    const result = await pool.query(
      "UPDATE providers SET status = 'rejected' WHERE id = $1 RETURNING id, full_name, status",
      [providerId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: "Provider not found" });
    res.json({ success: true, provider: result.rows[0] });
  } catch (err) {
    console.error("Error rejecting provider:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/providers/applications/:id
router.get("/applications/:id", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");
  const providerId = parseInt(req.params.id, 10);
  if (!providerId) return res.status(400).json({ message: "Invalid provider ID" });
  if (req.user.role === "provider" && req.user.id !== providerId) return res.status(403).json({ message: "Unauthorized" });
  try {
    const { rows } = await pool.query(
      `SELECT ja.id AS application_id, j.id AS job_id, j.title AS job_title, ja.status, ja.created_at
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       WHERE ja.provider_id = $1
       ORDER BY ja.created_at DESC`,
      [providerId]
    );
    res.json({ success: true, applications: rows });
  } catch (err) {
    console.error("Error fetching provider applications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
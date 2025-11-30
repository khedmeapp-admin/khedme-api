// backend/routes/jobs.js
import express from "express";
import { authMiddleware } from "../middleware/auth.js"; // <- fixed import

const router = express.Router();

// ---------------------------------------------
// POST /api/jobs/create
// Admin or client only: Create a new job
// Body: { title, description, category_id, district_id, budget, date }
// ---------------------------------------------
router.post("/create", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");

  if (!["admin", "client"].includes(req.user.role)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { title, description, category_id, district_id, budget, date } = req.body;

  if (!title || !description || !category_id || !district_id || !budget || !date) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO jobs (title, description, category_id, district_id, budget, date, client_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, category_id, district_id, budget, date, req.user.id]
    );

    res.json({ success: true, job: result.rows[0] });
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------------------------------------
// GET /api/jobs/all
// Public: Fetch all jobs (optional filters can be added later)
// ---------------------------------------------
router.get("/all", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");

  try {
    const { rows } = await pool.query(
      `SELECT j.id, j.title, j.description, j.budget, j.date,
              c.name AS category_name, c.name_ar AS category_name_ar,
              d.name AS district_name, d.name_ar AS district_name_ar,
              j.client_id
       FROM jobs j
       JOIN categories c ON j.category_id = c.id
       JOIN districts d ON j.district_id = d.id
       ORDER BY j.date DESC`
    );

    res.json({ success: true, jobs: rows });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------------------------------------
// POST /api/jobs/apply
// Provider only: Apply to a job
// Body: { job_id }
// ---------------------------------------------
router.post("/apply", authMiddleware, async (req, res) => {
  const pool = req.app.get("pool");

  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { job_id } = req.body;
  if (!job_id) return res.status(400).json({ message: "job_id is required" });

  try {
    // Check if already applied
    const existing = await pool.query(
      "SELECT id FROM job_applications WHERE job_id = $1 AND provider_id = $2",
      [job_id, req.user.id]
    );
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    const result = await pool.query(
      `INSERT INTO job_applications (job_id, provider_id, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [job_id, req.user.id]
    );

    res.json({ success: true, application: result.rows[0] });
  } catch (err) {
    console.error("Error applying to job:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;

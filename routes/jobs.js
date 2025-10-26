// routes/jobs.js
import express from "express";
const router = express.Router();

// ✅ Create a new job
router.post("/create", async (req, res) => {
  const pool = req.pool; // use pool passed from index.js
  try {
    const { description, service, district, budget } = req.body;

    if (!description || !service || !district) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { rows } = await pool.query(
      `INSERT INTO jobs (description, service, district, budget, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())
       RETURNING *`,
      [description, service, district, budget || 0]
    );

    res.status(201).json({ message: "Job created successfully", job: rows[0] });
  } catch (err) {
    console.error("[CREATE JOB ERROR]:", err.message);
    res.status(500).json({ message: "Server error while creating job" });
  }
});

// ✅ Get all jobs
router.get("/all", async (req, res) => {
  const pool = req.pool; // use pool passed from index.js
  try {
    const { rows } = await pool.query(
      "SELECT * FROM jobs ORDER BY created_at DESC"
    );
    res.status(200).json({ jobs: rows });
  } catch (err) {
    console.error("[GET ALL JOBS ERROR]:", err.message);
    res.status(500).json({ message: "Server error while fetching jobs" });
  }
});

export default router;

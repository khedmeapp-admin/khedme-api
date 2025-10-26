// routes/jobs.js
import express from "express";
const router = express.Router();

// ✅ Create a new job
router.post("/create", async (req, res) => {
  const pool = req.pool;
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
  const pool = req.pool;
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

// ✅ Get a specific job by ID
router.get("/:id", async (req, res) => {
  const pool = req.pool;
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({ job: rows[0] });
  } catch (err) {
    console.error("[GET JOB BY ID ERROR]:", err.message);
    res.status(500).json({ message: "Server error while fetching job" });
  }
});

// ✅ Apply for a job
router.post("/:id/apply", async (req, res) => {
  const pool = req.pool;
  try {
    const jobId = req.params.id;
    const { provider_name, provider_phone, message } = req.body;

    if (!provider_name || !provider_phone) {
      return res.status(400).json({ message: "Missing provider information" });
    }

    // Create job_applications table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        provider_name TEXT NOT NULL,
        provider_phone TEXT NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const { rows } = await pool.query(
      `INSERT INTO job_applications (job_id, provider_name, provider_phone, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [jobId, provider_name, provider_phone, message || ""]
    );

    res.status(201).json({
      message: "Application submitted successfully",
      application: rows[0],
    });
  } catch (err) {
    console.error("[APPLY JOB ERROR]:", err.message);
    res.status(500).json({ message: "Server error while applying for job" });
  }
});

export default router;

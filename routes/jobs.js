// routes/jobs.js
import express from "express";
const router = express.Router();

/* ---------------------------------------------------
   🧪 Test Database Connection
--------------------------------------------------- */
router.get("/test-db", async (req, res) => {
  const pool = req.pool;
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database test result:", result.rows);
    res.json({
      success: true,
      message: "Database connection successful ✅",
      time: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
    });
  }
});

/* ---------------------------------------------------
   ✅ Create new job
--------------------------------------------------- */
router.post("/create", async (req, res) => {
  const { service, district, description, budget } = req.body;
  const pool = req.pool;

  if (!service || !district || !description || !budget) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO jobs (service, district, description, budget, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [service, district, description, budget]
    );

    console.log("✅ Job created:", result.rows[0]);
    res.status(201).json({
      success: true,
      message: "Job posted successfully ✅",
      job: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error creating job:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Fetch all jobs
--------------------------------------------------- */
router.get("/all", async (req, res) => {
  const pool = req.pool;
  try {
    const result = await pool.query("SELECT * FROM jobs ORDER BY created_at DESC");
    console.log(`📦 Returned ${result.rows.length} jobs`);
    res.json({ success: true, jobs: result.rows });
  } catch (err) {
    console.error("❌ Error fetching jobs:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Fetch single job by ID
--------------------------------------------------- */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const pool = req.pool;

  try {
    const result = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Job not found" });

    res.json({ success: true, job: result.rows[0] });
  } catch (err) {
    console.error("❌ Error fetching job:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Provider applies for a job
--------------------------------------------------- */
router.post("/apply", async (req, res) => {
  const pool = req.pool;
  const { job_id, provider_id, message } = req.body;

  if (!job_id || !provider_id) {
    return res.status(400).json({
      success: false,
      message: "Missing job_id or provider_id",
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO job_applications (job_id, provider_id, message, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [job_id, provider_id, message || null]
    );

    console.log("✅ Job application created:", rows[0]);
    res.json({
      success: true,
      message: "Application submitted successfully ✅",
      application: rows[0],
    });
  } catch (error) {
    console.error("❌ Error applying for job:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;

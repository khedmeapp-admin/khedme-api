// routes/apply.js
import express from "express";
const router = express.Router();

/* ---------------------------------------------------
   ✅ Apply for a Job
   Endpoint: POST /api/jobs/apply
   Body: { job_id, provider_id, message }
--------------------------------------------------- */
router.post("/apply", async (req, res) => {
  const pool = req.pool;
  const { job_id, provider_id, message } = req.body;

  if (!job_id || !provider_id || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO job_applications (job_id, provider_id, message, status, created_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING *;
    `;
    const result = await pool.query(query, [job_id, provider_id, message]);

    res.status(201).json({
      message: "Job application submitted successfully ✅",
      application: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error applying for job:", error.message);
    res.status(500).json({ error: "Server error while applying for job" });
  }
});

export default router;

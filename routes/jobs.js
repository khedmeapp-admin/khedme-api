// routes/jobs.js
import express from "express";
const router = express.Router();

/* ---------------------------------------------------
 ✅ TEST ROUTE — to confirm deployment
--------------------------------------------------- */
router.get("/test", (req, res) => {
  res.json({ message: "Jobs router is live ✅" });
});

/* ---------------------------------------------------
 ✅ Apply to a job
--------------------------------------------------- */
router.post("/:id/apply", async (req, res) => {
  const pool = req.pool;
  const jobId = req.params.id;
  const { provider_id, message } = req.body;

  console.log("📩 Apply Request Body:", req.body);

  // Validation
  if (!provider_id) {
    return res.status(400).json({ message: "Missing provider ID" });
  }

  try {
    const query = `
      INSERT INTO job_applications (job_id, provider_id, message, status, created_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING *;
    `;
    const values = [jobId, provider_id, message];
    const { rows } = await pool.query(query, values);

    console.log("✅ Application inserted:", rows[0]);
    res.status(201).json({
      message: "Application submitted successfully ✅",
      application: rows[0],
    });
  } catch (err) {
    console.error("❌ Error applying for job:", err.message);
    res.status(500).json({ message: "Server error while applying for job" });
  }
});

export default router;

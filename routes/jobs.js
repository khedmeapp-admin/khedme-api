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

/* ---------------------------------------------------
 ✅ Get all applications for a specific job
--------------------------------------------------- */
router.get("/:id/applications", async (req, res) => {
  const pool = req.pool;
  const jobId = req.params.id;

  try {
    const query = `
      SELECT *
      FROM job_applications
      WHERE job_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [jobId]);

    res.status(200).json({ applications: rows });
  } catch (err) {
    console.error("❌ Error fetching job applications:", err.message);
    res.status(500).json({ message: "Server error while fetching applications" });
  }
});

/* ---------------------------------------------------
 ✅ Approve or Reject a Job Application
--------------------------------------------------- */
router.post("/applications/:id/approve", async (req, res) => {
  const pool = req.pool;
  const appId = req.params.id;

  try {
    const { rows } = await pool.query(
      `UPDATE job_applications 
       SET status = 'approved' 
       WHERE id = $1 
       RETURNING *;`,
      [appId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Application not found" });

    console.log("✅ Application approved:", rows[0]);
    res.json({ message: "Application approved ✅", application: rows[0] });
  } catch (err) {
    console.error("❌ Error approving application:", err.message);
    res.status(500).json({ message: "Server error while approving" });
  }
});

router.post("/applications/:id/reject", async (req, res) => {
  const pool = req.pool;
  const appId = req.params.id;

  try {
    const { rows } = await pool.query(
      `UPDATE job_applications 
       SET status = 'rejected' 
       WHERE id = $1 
       RETURNING *;`,
      [appId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Application not found" });

    console.log("🚫 Application rejected:", rows[0]);
    res.json({ message: "Application rejected 🚫", application: rows[0] });
  } catch (err) {
    console.error("❌ Error rejecting application:", err.message);
    res.status(500).json({ message: "Server error while rejecting" });
  }
});

export default router;

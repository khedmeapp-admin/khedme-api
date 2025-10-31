// routes/providers.js
import express from "express";
const router = express.Router();

/* ---------------------------------------------------
   ✅ Get all pending providers (for admin dashboard)
--------------------------------------------------- */
router.get("/pending", async (req, res) => {
  const pool = req.pool;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM providers WHERE approved = false"
    );
    res.json({ success: true, providers: rows });
  } catch (error) {
    console.error("❌ Error fetching pending providers:", error.message);
    res.status(500).json({ success: false, message: "Server error fetching providers" });
  }
});

/* ---------------------------------------------------
   ✅ Provider applies to a job
--------------------------------------------------- */
router.post("/apply", async (req, res) => {
  const pool = req.pool;
  const { job_id, provider_id, message } = req.body;

  try {
    const insertQuery = `
      INSERT INTO job_applications (job_id, provider_id, message)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(insertQuery, [job_id, provider_id, message]);
    res.json({ success: true, message: "Application submitted successfully ✅", application: rows[0] });
  } catch (error) {
    console.error("❌ Error submitting application:", error.message);
    res.status(500).json({ success: false, message: "Server error submitting application" });
  }
});

/* ---------------------------------------------------
   ✅ Fetch provider's job applications (My Applications)
--------------------------------------------------- */
router.get("/applications/:id", async (req, res) => {
  const pool = req.pool;
  const providerId = req.params.id;

  try {
    const query = `
      SELECT 
        ja.id AS application_id,
        ja.message,
        ja.status,
        ja.created_at,
        j.id AS job_id,
        j.service,
        j.description,
        j.district,
        j.budget,
        j.status AS job_status
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.provider_id = $1
      ORDER BY ja.created_at DESC;
    `;
    const { rows } = await pool.query(query, [providerId]);
    res.json({ success: true, applications: rows });
  } catch (error) {
    console.error("❌ Error fetching provider applications:", error.message);
    res.status(500).json({ success: false, message: "Server error fetching applications" });
  }
});

export default router;

// routes/providers.js
import express from "express";
import pool from "../db.js"; // PostgreSQL / Supabase connection pool

const router = express.Router();

/* ---------------------------------------------------
   ✅ Get all pending providers (for admin dashboard)
--------------------------------------------------- */
router.get("/pending", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM providers WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json({ providers: rows });
  } catch (error) {
    console.error("Error fetching pending providers:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------------------------------
   ✅ Approve a provider (admin action)
--------------------------------------------------- */
router.post("/approve", async (req, res) => {
  const { id } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE providers SET status = 'approved' WHERE id = $1 RETURNING *",
      [id]
    );
    res.json({ message: "Provider approved ✅", provider: rows[0] });
  } catch (error) {
    console.error("Error approving provider:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------------------------------
   ✅ Reject a provider (admin action)
--------------------------------------------------- */
router.post("/reject", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("DELETE FROM providers WHERE id = $1", [id]);
    res.json({ message: "Provider rejected and removed ❌" });
  } catch (error) {
    console.error("Error rejecting provider:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------------------------------
   ✅ Get provider profile by ID
--------------------------------------------------- */
router.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query("SELECT * FROM providers WHERE id = $1", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Provider not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching provider profile:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------------------------------------
   ✅ Update provider profile (fixed)
--------------------------------------------------- */
router.patch("/update", async (req, res) => {
  const { id, name, service, district } = req.body;

  if (!id) return res.status(400).json({ message: "Missing provider ID" });

  try {
    const result = await pool.query(
      "UPDATE providers SET name=$1, service=$2, district=$3 WHERE id=$4 RETURNING *;",
      [name, service, district, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Provider not found" });

    res.json({
      message: "Profile updated successfully ✅",
      provider: result.rows[0],
    });
  } catch (err) {
    console.error("[UPDATE PROVIDER ERROR]:", err);
    res.status(500).json({ message: "Server error updating provider" });
  }
});

/* ---------------------------------------------------
   ✅ Apply for a Job
--------------------------------------------------- */
router.post("/apply", async (req, res) => {
  const pool = req.pool; // ✅ use the shared pool injected by index.js
  const { job_id, provider_id, message } = req.body;

  if (!job_id || !provider_id)
    return res.status(400).json({ message: "job_id and provider_id are required" });

  try {
    const result = await pool.query(
      `INSERT INTO job_applications (job_id, provider_id, message, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       RETURNING *`,
      [job_id, provider_id, message || null]
    );

    res.json({
      message: "Application sent ✅",
      application: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error applying for job:", error.message);
    res.status(500).json({ message: "Server error applying for job", error: error.message });
  }
});

/* ---------------------------------------------------
   ✅ Get all applications for a specific provider
--------------------------------------------------- */
router.get("/applications/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT ja.*, j.service, j.district, j.budget
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       WHERE ja.provider_id = $1
       ORDER BY ja.created_at DESC`,
      [id]
    );
    res.json({ applications: rows });
  } catch (error) {
    console.error("Error fetching provider applications:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

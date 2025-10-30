// routes/providers.js
import express from "express";
const router = express.Router();

/* ---------------------------------------------------
   ✅ Get all pending providers (for admin dashboard)
--------------------------------------------------- */
router.get("/pending", async (req, res) => {
  const pool = req.pool;
  try {
    const result = await pool.query(
      "SELECT * FROM providers WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json({ success: true, providers: result.rows });
  } catch (err) {
    console.error("❌ Error fetching pending providers:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   ✅ Approve a provider (admin action)
--------------------------------------------------- */
router.post("/approve", async (req, res) => {
  const pool = req.pool;
  const { id } = req.body;

  if (!id) return res.status(400).json({ message: "Provider ID is required" });

  try {
    const result = await pool.query(
      "UPDATE providers SET status = 'approved' WHERE id = $1 RETURNING *",
      [id]
    );
    res.json({ message: "Provider approved ✅", provider: result.rows[0] });
  } catch (err) {
    console.error("❌ Error approving provider:", err.message);
    res.status(500).json({ message: "Server error approving provider" });
  }
});

/* ---------------------------------------------------
   ✅ Reject a provider (admin action)
--------------------------------------------------- */
router.post("/reject", async (req, res) => {
  const pool = req.pool;
  const { id } = req.body;

  if (!id) return res.status(400).json({ message: "Provider ID is required" });

  try {
    await pool.query("DELETE FROM providers WHERE id = $1", [id]);
    res.json({ message: "Provider rejected and removed ❌" });
  } catch (err) {
    console.error("❌ Error rejecting provider:", err.message);
    res.status(500).json({ message: "Server error rejecting provider" });
  }
});

/* ---------------------------------------------------
   ✅ Get provider profile by ID
--------------------------------------------------- */
router.get("/profile/:id", async (req, res) => {
  const pool = req.pool;
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM providers WHERE id = $1", [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Provider not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching provider profile:", err.message);
    res.status(500).json({ message: "Server error fetching provider profile" });
  }
});

/* ---------------------------------------------------
   ✅ Update provider profile
--------------------------------------------------- */
router.patch("/update", async (req, res) => {
  const pool = req.pool;
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
    console.error("❌ Error updating provider profile:", err.message);
    res.status(500).json({ message: "Server error updating provider" });
  }
});

/* ---------------------------------------------------
   ✅ Provider applies for a job (fixed)
--------------------------------------------------- */
router.post("/apply", async (req, res) => {
  const pool = req.pool;
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
      success: true,
      message: "Application submitted successfully ✅",
      application: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error applying for job:", err.message);
    res.status(500).json({ success: false, message: "Server error applying for job" });
  }
});

/* ---------------------------------------------------
   ✅ Get all applications for a specific provider
--------------------------------------------------- */
router.get("/applications/:id", async (req, res) => {
  const pool = req.pool;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT ja.*, j.service, j.district, j.budget
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       WHERE ja.provider_id = $1
       ORDER BY ja.created_at DESC`,
      [id]
    );
    res.json({ success: true, applications: result.rows });
  } catch (err) {
    console.error("❌ Error fetching provider applications:", err.message);
    res.status(500).json({ success: false, message: "Server error fetching applications" });
  }
});

export default router;

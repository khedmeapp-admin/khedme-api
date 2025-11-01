// routes/providers.js
import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

/* ---------------------------------------------------
   🧩 Safe Supabase connection (Render-friendly)
--------------------------------------------------- */
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  console.log("✅ Supabase client initialized (providers.js)");
} else {
  console.warn("⚠️ Supabase credentials missing — using PG pool fallback when possible.");
}

/* ---------------------------------------------------
   ✅ Get all pending providers (Admin Dashboard)
--------------------------------------------------- */
router.get("/pending", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("approved", false);

      if (error) throw error;
      return res.json({ success: true, providers: data });
    }

    // fallback to pg pool
    const pool = req.pool;
    const { rows } = await pool.query("SELECT * FROM providers WHERE approved = false");
    res.json({ success: true, providers: rows });
  } catch (err) {
    console.error("❌ Error fetching pending providers:", err.message);
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
    res.json({
      success: true,
      message: "Application submitted successfully ✅",
      application: rows[0],
    });
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

/* ---------------------------------------------------
   ✅ Approve a provider
--------------------------------------------------- */
router.post("/approve", async (req, res) => {
  const pool = req.pool;
  const id = req.query.id;
  if (!id) return res.status(400).json({ success: false, message: "Missing provider ID" });

  try {
    const { rows } = await pool.query(
      "UPDATE providers SET approved = true, status = 'approved' WHERE id = $1 RETURNING *;",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Provider not found" });

    res.json({ success: true, message: "Provider approved ✅", provider: rows[0] });
  } catch (err) {
    console.error("❌ Error approving provider:", err.message);
    res.status(500).json({ success: false, message: "Server error approving provider" });
  }
});

/* ---------------------------------------------------
   ✅ Reject a provider (mark as rejected)
--------------------------------------------------- */
router.post("/reject", async (req, res) => {
  const pool = req.pool;
  const id = req.query.id;
  if (!id) return res.status(400).json({ success: false, message: "Missing provider ID" });

  try {
    const { rows } = await pool.query(
      "UPDATE providers SET approved = false, status = 'rejected' WHERE id = $1 RETURNING *;",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Provider not found" });

    res.json({ success: true, message: "Provider rejected ✅", provider: rows[0] });
  } catch (err) {
    console.error("❌ Error rejecting provider:", err.message);
    res.status(500).json({ success: false, message: "Server error rejecting provider" });
  }
});

export default router;

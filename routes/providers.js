// routes/providers.js
import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

/* ---------------------------------------------------
   🧩 Safe Supabase connection (only if env vars exist)
--------------------------------------------------- */
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  console.log("✅ Supabase client initialized");
} else {
  console.warn("⚠️ Supabase credentials missing — pending providers route will use PG fallback if needed.");
}

/* ---------------------------------------------------
   ✅ Get all pending providers (for admin dashboard)
--------------------------------------------------- */
router.get("/pending", async (req, res) => {
  try {
    // ✅ Use Supabase if available, otherwise fallback to Postgres pool
    if (supabase) {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("approved", false);

      if (error) {
        console.error("❌ Supabase error fetching providers:", error.message);
        return res.status(500).json({ success: false, message: "Supabase error fetching providers" });
      }

      return res.json({ success: true, providers: data });
    } else {
      const pool = req.pool;
      const { rows } = await pool.query("SELECT * FROM providers WHERE approved = false");
      return res.json({ success: true, providers: rows });
    }
  } catch (err) {
    console.error("❌ Server error fetching pending providers:", err.message);
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

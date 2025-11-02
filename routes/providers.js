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

    const pool = req.pool;
    const { rows } = await pool.query("SELECT * FROM providers WHERE approved = false");
    res.json({ success: true, providers: rows });
  } catch (err) {
    console.error("❌ Error fetching pending providers:", err.message);
    res.status(500).json({ success: false, message: "Server error fetching providers" });
  }
});

/* ---------------------------------------------------
   ✅ Provider applies to a job (Render-safe + duplicate check)
--------------------------------------------------- */
router.post("/apply", async (req, res) => {
  const { job_id, provider_id, message } = req.body;

  if (!job_id || !provider_id)
    return res.status(400).json({ success: false, message: "Missing job_id or provider_id" });

  try {
    // ✅ Prefer Supabase if available (Render)
    if (supabase) {
      console.log("🟠 Supabase apply route hit:", { job_id, provider_id, message });

      // Check if already applied
      const { data: existing, error: checkError } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", job_id)
        .eq("provider_id", provider_id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing)
        return res.json({
          success: false,
          message: "You have already applied for this job ❗",
        });

      // Insert new application
      const { data, error } = await supabase
        .from("job_applications")
        .insert([
          {
            job_id,
            provider_id,
            message: message || "No message provided",
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: "Application submitted successfully ✅",
        application: data,
      });
    }

    // 🧩 Local fallback using PG pool
    const pool = req.pool;

    // Prevent duplicates locally
    const { rows: existingRows } = await pool.query(
      "SELECT id FROM job_applications WHERE job_id = $1 AND provider_id = $2",
      [job_id, provider_id]
    );
    if (existingRows.length > 0)
      return res.json({
        success: false,
        message: "You have already applied for this job ❗",
      });

    const insertQuery = `
      INSERT INTO job_applications (job_id, provider_id, message, status)
      VALUES ($1, $2, $3, 'pending')
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
   ✅ Update provider availability status
--------------------------------------------------- */
router.post("/update-status", async (req, res) => {
  const { provider_id, available } = req.body;

  if (!provider_id || available === undefined)
    return res.status(400).json({ success: false, message: "Missing provider_id or availability" });

  try {
    // ✅ Prefer Supabase if available
    if (supabase) {
      const { data, error } = await supabase
        .from("providers")
        .update({ available })
        .eq("id", provider_id)
        .select("id, available")
        .single();

      if (error) throw error;
      return res.json({
        success: true,
        message: "Provider status updated ✅",
        provider: data,
      });
    }

    // 🧩 Local fallback using PG pool
    const pool = req.pool;
    const { rows } = await pool.query(
      "UPDATE providers SET available = $1 WHERE id = $2 RETURNING id, available",
      [available, provider_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Provider not found" });

    res.json({
      success: true,
      message: "Provider status updated ✅",
      provider: rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating provider status:", error);
    res.status(500).json({ success: false, message: "Server error updating provider status" });
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
   ✅ Reject a provider
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

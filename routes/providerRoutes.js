// routes/providers.js
import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// GET /api/providers/pending
router.get("/pending", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("providers")
      .select("*, users(email, full_name, phone)")
      .eq("status", "pending");

    if (error) throw error;

    res.json({ success: true, providers: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/providers/approve
router.post("/approve", async (req, res) => {
  try {
    const { provider_id } = req.body;
    if (!provider_id)
      return res.json({ success: false, message: "provider_id is required" });

    const { error } = await supabase
      .from("providers")
      .update({ status: "approved" })
      .eq("id", provider_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/providers/reject
router.post("/reject", async (req, res) => {
  try {
    const { provider_id } = req.body;
    if (!provider_id)
      return res.json({ success: false, message: "provider_id is required" });

    const { error } = await supabase
      .from("providers")
      .update({ status: "rejected" })
      .eq("id", provider_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/providers/applications/:id
router.get("/applications/:id", async (req, res) => {
  try {
    const providerId = req.params.id;

    const { data, error } = await supabase
      .from("job_applications")
      .select("*, jobs(title, description, district)")
      .eq("provider_id", providerId);

    if (error) throw error;

    res.json({ success: true, applications: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/providers/all
router.get("/all", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("providers")
      .select("*, users(email, full_name)");

    if (error) throw error;

    res.json({ success: true, providers: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
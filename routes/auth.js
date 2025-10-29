import express from "express";
const router = express.Router();

/* ---------------------------------------------------
   ✅ Request OTP (Demo version)
   - Accepts existing or new providers
   - Always returns a providerId + OTP message
--------------------------------------------------- */
router.post("/request-otp", async (req, res) => {
  const pool = req.pool;
  const { phone, role } = req.body;

  if (!phone || !phone.startsWith("+961")) {
    return res.status(400).json({ message: "Invalid Lebanese number" });
  }

  try {
    // ✅ Check if provider already exists
    const existing = await pool.query("SELECT * FROM providers WHERE phone = $1", [phone]);

    let providerId;

    if (existing.rows.length > 0) {
      // Provider already exists — allow login instead of 409
      providerId = existing.rows[0].id;
      console.log(`[OTP] Existing provider login for ${phone} (ID: ${providerId})`);
    } else {
      // Create a new provider record if none exists
      const result = await pool.query(
        "INSERT INTO providers (phone, role, approved) VALUES ($1, $2, false) RETURNING id;",
        [phone, role || "provider"]
      );
      providerId = result.rows[0].id;
      console.log(`[OTP] New provider created for ${phone} (ID: ${providerId})`);
    }

    // ✅ In production, send an SMS here — demo code is static
    res.json({ providerId, message: "OTP sent (demo code: 123456)" });
  } catch (err) {
    console.error("[REQUEST OTP ERROR]:", err);
    res.status(500).json({ message: "Server error while requesting OTP" });
  }
});

/* ---------------------------------------------------
   ✅ Verify OTP (Demo version)
--------------------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  const pool = req.pool;
  const { providerId, otp } = req.body;

  if (otp !== "123456") {
    return res.status(400).json({ message: "Wrong code" });
  }

  try {
    const result = await pool.query(
      "UPDATE providers SET approved = true WHERE id = $1 RETURNING *;",
      [providerId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Provider not found" });
    }

    console.log(`[OTP] Provider verified successfully (ID: ${providerId})`);
    res.json({ message: "Provider verified successfully ✅", provider: result.rows[0] });
  } catch (err) {
    console.error("[VERIFY OTP ERROR]:", err);
    res.status(500).json({ message: "Server error while verifying OTP" });
  }
});

export default router;

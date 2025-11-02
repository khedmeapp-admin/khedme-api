import express from "express";
const router = express.Router();

/* ---------------------------------------------------
   ✅ Request OTP (Demo version)
   - Creates a new provider if phone not found
   - Reuses existing one otherwise
   - Returns providerId and demo OTP message
--------------------------------------------------- */
router.post("/request-otp", async (req, res) => {
  const pool = req.pool;
  const { phone } = req.body;

  if (!phone || !phone.startsWith("+961")) {
    return res.status(400).json({ message: "Invalid Lebanese number" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO providers (full_name, phone, role, approved)
       VALUES ($1, $2, 'provider', false)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id;`,
      ['Test Provider', phone]
    );

    const providerId = result.rows[0].id;
    console.log(`[OTP] Request for ${phone} (ID: ${providerId})`);

    // ✅ In production, you'd send an actual SMS. Demo uses static OTP.
    res.json({ providerId, message: "OTP sent (demo code: 123456)" });
  } catch (err) {
    console.error("[REQUEST OTP ERROR]:", err);
    res.status(500).json({ message: "Server error while requesting OTP" });
  }
});

/* ---------------------------------------------------
   ✅ Verify OTP (Demo version)
   - Marks provider as approved after OTP check
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

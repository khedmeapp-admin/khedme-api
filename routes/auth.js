import express from "express";
const router = express.Router();

// Demo OTP handler (uses static code 123456)
router.post("/request-otp", async (req, res) => {
  const pool = req.pool;
  const { phone, role } = req.body;

  if (!phone || !phone.startsWith("+961")) {
    return res.status(400).json({ message: "Invalid Lebanese number" });
  }

  try {
    const existing = await pool.query("SELECT * FROM providers WHERE phone = $1", [phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Phone number already registered" });
    }

    const result = await pool.query(
      "INSERT INTO providers (phone, role, approved) VALUES ($1, $2, false) RETURNING id;",
      [phone, role || "provider"]
    );

    const providerId = result.rows[0].id;
    res.json({ providerId, message: "OTP sent (demo code: 123456)" });
  } catch (err) {
    console.error("[REQUEST OTP ERROR]:", err.message);
    res.status(500).json({ message: "Server error while requesting OTP" });
  }
});

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

    res.json({ message: "Provider verified successfully ✅", provider: result.rows[0] });
  } catch (err) {
    console.error("[VERIFY OTP ERROR]:", err.message);
    res.status(500).json({ message: "Server error while verifying OTP" });
  }
});

export default router;

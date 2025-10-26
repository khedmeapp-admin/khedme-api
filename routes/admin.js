import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const ADMIN_EMAIL = "admin@khedme.com";
const ADMIN_PASSWORD = "123456";
const JWT_SECRET = "supersecretkey123";

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "2h" });
    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid admin credentials" });
});

export default router;

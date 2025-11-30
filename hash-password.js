// hash-password.js
import bcrypt from "bcryptjs";

const password = "password123"; // your desired admin password
const hash = await bcrypt.hash(password, 10);

console.log("Hashed password:", hash);

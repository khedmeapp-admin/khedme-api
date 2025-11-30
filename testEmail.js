import dotenv from "dotenv";
dotenv.config();
import { sendEmail } from "./utils/mailer.js";

const test = async () => {
  const success = await sendEmail(
    "haidar.abouzeid.1989@gmail.com", // <-- replace with your personal email
    "Test OTP",
    "Your OTP is 123456"
  );
  console.log("Email send success:", success);
};

test();

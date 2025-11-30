import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"Khedme App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log("[EMAIL SENT]:", info.response);
    return true;
  } catch (err) {
    console.error("[EMAIL ERROR]:", err);
    return false;
  }
};

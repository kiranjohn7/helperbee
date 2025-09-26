import { Router } from "express";
import User from "../models/User.js";
import { makeOTP, hashOTP } from "../utils/otp.js";
import { sendOTPEmail } from "../utils/email.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

// Called after Firebase signup/login to create/update user record + send OTP
router.post("/register", async (req, res) => {
  try {
    const { uid, email, name, role } = req.body;
    if (!uid || !email || !name || !role)
      return res.status(400).json({ error: "Missing fields" });

    const code = makeOTP();
    const otpHash = hashOTP(code);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ uid });
    if (user) {
      user.email = email;
      user.name = name;
      user.role = role;
      user.isVerified = false;
      user.otpHash = otpHash;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      user = await User.create({
        uid,
        email,
        name,
        role,
        isVerified: false,
        otpHash,
        otpExpiresAt,
      });
    }

    await sendOTPEmail(email, code);
    res.json({ ok: true, message: "OTP sent to email" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { uid, code } = req.body;
    if (!uid || !code) return res.status(400).json({ error: "Missing fields" });
    const user = await User.findOne({ uid });
    if (!user || !user.otpHash || !user.otpExpiresAt)
      return res.status(400).json({ error: "No OTP pending" });
    if (user.otpExpiresAt.getTime() < Date.now())
      return res.status(400).json({ error: "OTP expired" });
    if (user.otpHash !== hashOTP(code))
      return res.status(400).json({ error: "Invalid OTP" });

    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Current user
router.get("/me", requireUser, async (req, res) => {
  const uid = req?.user?.uid || req?.firebase?.uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const u = await User.findOne({ uid }).lean();
  return res.json({
    user: u
      ? {
          _id: String(u._id),
          uid: u.uid,
          email: u.email,
          name: u.name,
          role: u.role,
          isVerified: !!u.isVerified,
          avatarUrl: u.avatarUrl,
          phone: u.phone,
          city: u.city,
          about: u.about,
          skills: u.skills || [],
        }
      : null,
  });
});



export default router;

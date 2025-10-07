// server/src/routes/users.js
import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

// Optional: always JSON + no-cache
router.use((_, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.type("application/json");
  next();
});

router.patch("/", requireUser, async (req, res) => {
  try {
    const uid = req.user.uid;
    const allowed = {};
    const { name, city, about, phone, avatarUrl, skills } = req.body || {};

    if (name !== undefined) allowed.name = String(name);
    if (city !== undefined) allowed.city = String(city);
    if (about !== undefined) allowed.about = String(about);
    if (phone !== undefined) allowed.phone = String(phone);
    if (avatarUrl !== undefined) allowed.avatarUrl = String(avatarUrl);

    if (skills !== undefined) {
      allowed.skills = Array.isArray(skills)
        ? skills.map((s) => String(s).trim()).filter(Boolean)
        : String(skills)
            .split(/,\s*/g)
            .map((s) => s.trim())
            .filter(Boolean);
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: allowed },
      {
        new: true,
        runValidators: true,
        // strict still applies from the schema, but our whitelist also protects us
      }
    ).lean();

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ ok: true, user });
  } catch (e) {
    console.error("PATCH /api/users", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
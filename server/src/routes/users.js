import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

router.patch("/", requireUser, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ uid: req.user.uid }, req.body, { new: true });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
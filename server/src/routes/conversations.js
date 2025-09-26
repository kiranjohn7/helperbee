import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

const router = Router();

router.get("/", requireUser, async (req, res) => {
  const user = await User.findOne({ uid: req.user.uid });
  if (!user) return res.json({ conversations: [] });
  const convos = await Conversation.find({ $or: [{ hirerId: user._id }, { workerId: user._id }] }).sort({ createdAt: -1 });
  res.json({ conversations: convos });
});

export default router;
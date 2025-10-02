// server/src/routes/conversations.js
import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

const router = Router();

router.get("/", requireUser, async (req, res) => {
  const user = await User.findOne({ uid: req.user.uid });
  if (!user) return res.json({ conversations: [] });
  const convos = await Conversation.find({
    $or: [{ hirerId: user._id }, { workerId: user._id }],
  }).sort({ createdAt: -1 });
  res.json({ conversations: convos });
});

/** NEW: GET /api/conversations/by-job/:jobId — returns the convo for this job if requester is a participant */
router.get("/by-job/:jobId", requireUser, async (req, res) => {
  const me = await User.findOne({ uid: req.user.uid }).select("_id").lean();
  if (!me) return res.status(401).json({ error: "Unauthorized" });

  const convo = await Conversation.findOne({
    jobId: req.params.jobId,
    $or: [{ hirerId: me._id }, { workerId: me._id }],
  }).lean();

  if (!convo) return res.status(404).json({ error: "Conversation not found" });
  return res.json({ conversation: convo });
});

export default router;
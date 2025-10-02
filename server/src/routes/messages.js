// server/src/routes/messages.js
import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const router = Router();

// Optional: no-store for this router
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// GET /api/messages?conversationId=...  OR  /api/messages/:conversationId
router.get(["/", "/:conversationId"], requireUser, async (req, res) => {
  const conversationId = req.query.conversationId || req.params.conversationId;
  if (!conversationId)
    return res.status(400).json({ error: "conversationId required" });

  const me = await User.findOne({ uid: req.user.uid }).select("_id").lean();
  if (!me) return res.status(401).json({ error: "Unauthorized" });
  const convo = await Conversation.findById(conversationId).lean();
  if (!convo) return res.status(404).json({ error: "Conversation not found" });
  const isParticipant =
    String(convo.hirerId) === String(me._id) ||
    String(convo.workerId) === String(me._id);
  if (!isParticipant)
    return res.status(403).json({ error: "Not a participant" });

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();
  return res.json({ messages });
});

// POST /api/messages
router.post("/", requireUser, async (req, res) => {
  const { conversationId, senderId, text } = req.body || {};
  if (!conversationId || !senderId || !text) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const user = await User.findOne({ uid: req.user.uid }).select("_id").lean();
  if (!user || String(user._id) !== String(senderId)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const convo = await Conversation.findById(conversationId).lean();
  if (!convo) return res.status(404).json({ error: "Conversation not found" });

  // extra safety: ensure the sender belongs to this conversation
  const isParticipant =
    String(convo.hirerId) === String(user._id) ||
    String(convo.workerId) === String(user._id);
  if (!isParticipant)
    return res.status(403).json({ error: "Not a participant" });

  const message = await Message.create({ conversationId, senderId, text });
  return res.json({ message });
});

export default router;

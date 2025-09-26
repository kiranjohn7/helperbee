import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const router = Router();

router.get("/", async (req, res) => {
  const { conversationId } = req.query;
  if (!conversationId) return res.status(400).json({ error: "conversationId required" });
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
  res.json({ messages });
});

router.post("/", requireUser, async (req, res) => {
  const { conversationId, senderId, text } = req.body;
  if (!conversationId || !senderId || !text) return res.status(400).json({ error: "Missing fields" });

  const user = await User.findOne({ uid: req.user.uid });
  if (!user || String(user._id) !== String(senderId)) return res.status(403).json({ error: "Not authorized" });

  const convo = await Conversation.findById(conversationId);
  if (!convo) return res.status(404).json({ error: "Conversation not found" });

  const message = await Message.create({ conversationId, senderId, text });
  res.json({ message });
});

export default router;
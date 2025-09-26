import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import User from "../models/User.js";
import Application from "../models/Application.js";

const router = Router();

router.get("/", requireUser, async (req, res) => {
  const user = await User.findOne({ uid: req.user.uid });
  const apps = await Application.find({ workerId: user?._id }).sort({ createdAt: -1 });
  res.json({ applications: apps });
});

router.post("/", requireUser, async (req, res) => {
  const user = await User.findOne({ uid: req.user.uid });
  if (!user || user.role !== "worker") return res.status(403).json({ error: "Only workers can apply" });
  const application = await Application.create({ ...req.body, workerId: user._id });
  res.json({ application });
});

export default router;
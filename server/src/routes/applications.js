import { Router } from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js"; // assuming you have one
import { requireUser } from "../middleware/auth.js";

const router = Router();

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.type("application/json");
  next();
});

/** POST /api/applications  (worker applies) */
router.post("/", requireUser, async (req, res) => {
  try {
    const uid = req.user.uid;
    const me = await User.findOne({ uid }).select("_id role isVerified").lean();
    if (!me || me.role !== "worker" || !me.isVerified) {
      return res.status(403).json({ error: "Workers only" });
    }

    const { jobId, coverLetter = "" } = req.body || {};
    const job = await Job.findById(jobId).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.status !== "open") {
      return res.status(400).json({ error: "Job is not open" });
    }

    const app = await Application.create({
      jobId,
      workerId: me._id,
      coverLetter,
      status: "pending",
    });

    return res.status(201).json({ ok: true, application: app });
  } catch (e) {
    console.error("POST /applications", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** GET /api/applications?job=<id>  (hirer views requests for their job) */
router.get("/", requireUser, async (req, res) => {
  try {
    const uid = req.user.uid;
    const me = await User.findOne({ uid }).select("_id role").lean();
    if (!me || me.role !== "hirer")
      return res.status(403).json({ error: "Hirers only" });

    const jobId = req.query.job;
    if (!jobId) return res.status(400).json({ error: "Missing job id" });

    const job = await Job.findById(jobId).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.hirerId) !== String(me._id)) {
      return res.status(403).json({ error: "Not your job" });
    }

    const apps = await Application.find({ jobId })
      .sort({ createdAt: -1 })
      .populate("workerId", "name email")
      .lean();

    return res.json({ applications: apps });
  } catch (e) {
    console.error("GET /applications", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** PATCH /api/applications/:id/accept  (hirer accepts → assign worker, create conversation, set job in_progress) */
router.patch("/:id/accept", requireUser, async (req, res) => {
  try {
    const uid = req.user.uid;
    const me = await User.findOne({ uid }).select("_id role").lean();
    if (!me || me.role !== "hirer")
      return res.status(403).json({ error: "Hirers only" });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    const job = await Job.findById(app.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.hirerId) !== String(me._id)) {
      return res.status(403).json({ error: "Not your job" });
    }
    if (job.status !== "open")
      return res.status(400).json({ error: "Job not open" });

    // accept this application, reject others for this job
    app.status = "accepted";
    await app.save();
    await Application.updateMany(
      { jobId: job._id, _id: { $ne: app._id }, status: "pending" },
      { $set: { status: "rejected" } }
    );

    // assign worker and flip job to in_progress
    job.workerId = app.workerId;
    job.status = "in_progress";
    await job.save();

    // ensure conversation exists between hirer and worker for this job
    // ensure conversation exists between hirer and worker for this job
    let convo = await Conversation.findOne({
      jobId: job._id,
      hirerId: job.hirerId,
      workerId: job.workerId,
    });

    if (!convo) {
      convo = await Conversation.create({
        jobId: job._id,
        hirerId: job.hirerId,
        workerId: job.workerId,
      });
    }

    return res.json({
      ok: true,
      application: app.toObject(),
      job: job.toObject(),
      conversationId: convo._id,
    });

  } catch (e) {
    console.error("ACCEPT /applications/:id", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** PATCH /api/applications/:id/reject  (hirer rejects) */
router.patch("/:id/reject", requireUser, async (req, res) => {
  try {
    const uid = req.user.uid;
    const me = await User.findOne({ uid }).select("_id role").lean();
    if (!me || me.role !== "hirer")
      return res.status(403).json({ error: "Hirers only" });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    const job = await Job.findById(app.jobId).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.hirerId) !== String(me._id)) {
      return res.status(403).json({ error: "Not your job" });
    }

    app.status = "rejected";
    await app.save();

    return res.json({ ok: true, application: app.toObject() });
  } catch (e) {
    console.error("REJECT /applications/:id", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;

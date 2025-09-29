// server/src/routes/jobs.js
import { Router } from "express";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { requireUser } from "../middleware/auth.js";

const router = Router();

/** Always return JSON and disable caching for this router */
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.type("application/json");
  next();
});

/**
 * GET /api/jobs
 * - Public:           /api/jobs                  → all jobs
 * - Private (hirer):  /api/jobs?mine=1           → only the logged-in hirer’s jobs
 */
router.get("/", async (req, res) => {
  try {
    const mine = ["1", "true", "yes"].includes(String(req.query.mine).toLowerCase());

    // Private branch: list only this hirer's jobs
    if (mine) {
      return requireUser(req, res, async () => {
        const uid = req?.user?.uid || req?.firebase?.uid;
        if (!uid) return res.status(401).json({ error: "Unauthorized" });

        // Your Job.hirerId is an ObjectId ref -> resolve the current user's _id from uid
        const me = await User.findOne({ uid }).select("_id role").lean();
        if (!me) return res.status(404).json({ error: "User not found" });
        if (me.role !== "hirer") {
          return res.status(403).json({ error: "Only hirers can view their jobs" });
        }

        const jobs = await Job.find({ hirerId: me._id })
          .sort({ createdAt: -1 })
          .lean();

        return res.json({ jobs: Array.isArray(jobs) ? jobs : [] });
      });
    }

    // Public branch: return all jobs
    const jobs = await Job.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ jobs: Array.isArray(jobs) ? jobs : [] });
  } catch (e) {
    console.error("GET /api/jobs error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** GET /api/jobs/:id — public job detail */
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json({ job });
  } catch (e) {
    console.error("GET /api/jobs/:id error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** POST /api/jobs — create job (requires: logged-in, verified, role=hirer) */
router.post("/", requireUser, async (req, res) => {
  try {
    const uid = req?.user?.uid || req?.firebase?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const me = await User.findOne({ uid });
    if (!me) return res.status(404).json({ error: "User not found" });
    if (!me.isVerified) return res.status(403).json({ error: "Account not verified" });
    if (me.role !== "hirer") return res.status(403).json({ error: "Only hirers can post jobs" });

    const {
      title,
      description,
      category,
      location,
      budgetMin,
      budgetMax,
      jobType,          // "one_time" | "ongoing"
      experienceLevel,  // "entry" | "intermediate" | "expert"
      deadline,
      skills = [],
      attachments = [],
    } = req.body || {};

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const job = await Job.create({
      hirerId: me._id, // store ObjectId ref
      title,
      description,
      category,
      location,
      budgetMin,
      budgetMax,
      jobType,
      experienceLevel,
      deadline: deadline ? new Date(deadline) : undefined,
      skills,
      attachments,
      status: "open",
    });

    return res.status(201).json({ ok: true, job });
  } catch (e) {
    console.error("POST /api/jobs error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** PATCH /api/jobs/:id  (hirer owner only) */
router.patch("/:id", requireUser, async (req, res) => {
  try {
    const uid = req?.user?.uid || req?.firebase?.uid;
    const me = await User.findOne({ uid }).select("_id role isVerified").lean();
    if (!me) return res.status(401).json({ error: "User not found" });
    if (!me.isVerified) return res.status(403).json({ error: "Account not verified" });
    if (me.role !== "hirer") return res.status(403).json({ error: "Only hirers can edit jobs" });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.hirerId) !== String(me._id)) {
      return res.status(403).json({ error: "Not your job" });
    }

    // Whitelist editable fields
    const {
      title,
      description,
      category,
      location,
      budgetMin,
      budgetMax,
      jobType,          // "one_time" | "ongoing"
      experienceLevel,  // "entry" | "intermediate" | "expert"
      deadline,
      status,           // "open" | "in_progress" | "completed"
      skills,
      attachments,
    } = req.body || {};

    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (category !== undefined) job.category = category;
    if (location !== undefined) job.location = location;
    if (budgetMin !== undefined) job.budgetMin = budgetMin;
    if (budgetMax !== undefined) job.budgetMax = budgetMax;
    if (jobType !== undefined) job.jobType = jobType;
    if (experienceLevel !== undefined) job.experienceLevel = experienceLevel;
    if (deadline !== undefined) job.deadline = deadline ? new Date(deadline) : undefined;
    if (status !== undefined) job.status = status;
    if (Array.isArray(skills)) job.skills = skills;
    if (Array.isArray(attachments)) job.attachments = attachments;

    await job.save();
    return res.json({ ok: true, job });
  } catch (e) {
    console.error("PATCH /api/jobs/:id error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** DELETE /api/jobs/:id  (hirer owner only) */
router.delete("/:id", requireUser, async (req, res) => {
  try {
    const uid = req?.user?.uid || req?.firebase?.uid;
    const me = await User.findOne({ uid }).select("_id role isVerified").lean();
    if (!me) return res.status(401).json({ error: "User not found" });
    if (!me.isVerified) return res.status(403).json({ error: "Account not verified" });
    if (me.role !== "hirer") return res.status(403).json({ error: "Only hirers can delete jobs" });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (String(job.hirerId) !== String(me._id)) {
      return res.status(403).json({ error: "Not your job" });
    }

    await job.deleteOne();
    return res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/jobs/:id error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});


export default router;
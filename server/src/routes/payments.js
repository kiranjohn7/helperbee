import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { requireUser } from "../middleware/auth.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Payment from "../models/Payment.js";

const router = Router();

router.use((_, res, next) => {
  res.set("Cache-Control", "no-store");
  res.type("application/json");
  next();
});

const PRODUCTS = {
  JOB_BOOST_7D:     { amount: 19900, label: "Featured Job Boost (7 days)", role: "hirer" },   // ₹199
  PROFILE_BOOST_7D: { amount:  9900, label: "Profile Boost (7 days)",       role: "worker" }, // ₹99
};

function assertKeys() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys missing (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET).");
  }
}

function addDaysFrom(baseDate, days) {
  const now = new Date();
  const base = baseDate && new Date(baseDate) > now ? new Date(baseDate) : now;
  base.setDate(base.getDate() + days);
  return base;
}

router.post("/order", requireUser, async (req, res) => {
  try {
    assertKeys();

    const uid = req.user.uid;
    const me = await User.findOne({ uid }).select("_id name email role").lean();
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const { productType, jobId } = req.body || {};
    const product = PRODUCTS[productType];
    if (!product) return res.status(400).json({ error: "Invalid productType" });

    // role guard
    if (me.role !== product.role) {
      return res.status(403).json({ error: `Only ${product.role}s can purchase this product` });
    }

    // job guard for job boost
    if (productType === "JOB_BOOST_7D") {
      if (!jobId) return res.status(400).json({ error: "jobId required for JOB_BOOST_7D" });
      const job = await Job.findById(jobId).lean();
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (String(job.hirerId) !== String(me._id)) {
        return res.status(403).json({ error: "Not your job" });
      }
      if (job.status === "completed") {
        return res.status(400).json({ error: "Cannot feature a completed job" });
      }
    }

    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await rzp.orders.create({
      amount: product.amount,
      currency: "INR",
      receipt: `hb_${productType}_${Date.now()}`,
      notes: { productType, jobId: jobId || "" },
    });

    await Payment.create({
      userId: me._id,
      productType,
      jobId: jobId || null,
      amount: product.amount,
      currency: "INR",
      orderId: order.id,
      status: "created",
    });

    return res.json({
      ok: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      label: product.label,
      keyId: process.env.RAZORPAY_KEY_ID,
      customer: { name: me.name, email: me.email },
    });
  } catch (e) {
    console.error("POST /payments/order", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
});

router.post("/verify", requireUser, async (req, res) => {
  try {
    assertKeys();

    const uid = req.user.uid;
    const me = await User.findOne({ uid }).select("_id").lean();
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // verify signature
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const pay = await Payment.findOne({ orderId: razorpay_order_id, userId: me._id });
    if (!pay) return res.status(404).json({ error: "Order not found" });

    // idempotent
    pay.paymentId = razorpay_payment_id;
    pay.status = "paid";
    await pay.save();

    const sevenMs = 7 * 24 * 60 * 60 * 1000;

    if (pay.productType === "JOB_BOOST_7D") {
      const job = await Job.findById(pay.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (String(job.hirerId) !== String(me._id)) {
        return res.status(403).json({ error: "Not your job" });
      }
      job.featuredUntil = addDaysFrom(job.featuredUntil, 7);
      await job.save();
      return res.json({ ok: true, applied: "JOB_BOOST_7D", featuredUntil: job.featuredUntil });
    }

    if (pay.productType === "PROFILE_BOOST_7D") {
      const user = await User.findById(me._id);
      user.profileBoostUntil = addDaysFrom(user.profileBoostUntil, 7);
      await user.save();
      return res.json({ ok: true, applied: "PROFILE_BOOST_7D", profileBoostUntil: user.profileBoostUntil });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("POST /payments/verify", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
});

export default router;
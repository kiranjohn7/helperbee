import { adminAuth } from "../config/firebaseAdmin.js";

// Verifies the Bearer token and attaches the decoded token to req.user and req.firebase
export async function requireUser(req, res, next) {
  try {
    const h = req.headers.authorization || req.headers.Authorization;
    if (!h || !String(h).startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = String(h).split(" ")[1];

    const decoded = await adminAuth.verifyIdToken(idToken); // { uid, email, ... }

    // attach in both places for compatibility
    req.user = { uid: decoded.uid, email: decoded.email || null };
    req.firebase = decoded;

    return next();
  } catch (e) {
    console.error("requireUser error:", e);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
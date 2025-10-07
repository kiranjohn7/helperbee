import { Router } from "express";
import { requireUser } from "../middleware/auth.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();

// Returns a short-lived signature & params for direct browser upload to Cloudinary
router.get("/avatar-signature", requireUser, async (req, res) => {
  try {
    const { filename = "avatar", type = "image/jpeg" } = req.query;
    // folder per app, public_id per user
    const folder = "helperbee/avatars";
    const publicId = `${req.user.uid}-${Date.now()}`; // unique per upload
    const timestamp = Math.floor(Date.now() / 1000);

    const toSign = { timestamp, folder, public_id: publicId };
    const signature = cloudinary.utils.api_sign_request(
      toSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    });
  } catch (e) {
    console.error("GET /uploads/avatar-signature", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
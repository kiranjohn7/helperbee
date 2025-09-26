import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  uid: { type: String, required: true, unique: true }, // Firebase uid
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["hirer", "worker"], required: true },
  avatarUrl: String,
  phone: String,
  city: String,
  about: String,
  skills: [String],
  isVerified: { type: Boolean, default: false },
  otpHash: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
}, { timestamps: true });

export default model("User", UserSchema);
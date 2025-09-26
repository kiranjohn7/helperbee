import crypto from "crypto";

export function makeOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
export function hashOTP(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const PaymentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  productType: { type: String, enum: ["JOB_BOOST_7D", "PROFILE_BOOST_7D"], required: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null },

  amount: { type: Number, required: true },   // paise
  currency: { type: String, default: "INR" },

  orderId: { type: String, required: true },  // Razorpay order id
  paymentId: { type: String, default: null },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
}, { timestamps: true });

export default model("Payment", PaymentSchema);
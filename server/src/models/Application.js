import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ApplicationSchema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    workerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coverLetter: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default model("Application", ApplicationSchema);

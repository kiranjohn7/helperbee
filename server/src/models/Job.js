import mongoose from "mongoose";
const { Schema, model } = mongoose;

const JobSchema = new Schema(
  {
    hirerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: String,
    status: {
      type: String,
      enum: ["open", "in_progress", "completed"],
      default: "open",
    },
    location: String,
    budgetMin: Number,
    budgetMax: Number,
    jobType: {
      type: String,
      enum: ["one_time", "ongoing"],
      default: "one_time",
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "intermediate", "expert"],
      default: "entry",
    },
    deadline: Date,
    skills: [String],
    attachments: [String],
  },
  { timestamps: true }
);

export default model("Job", JobSchema);

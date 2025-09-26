import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ConversationSchema = new Schema({
  hirerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  workerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
}, { timestamps: true });

export default model("Conversation", ConversationSchema);
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISendLog extends Document {
  campaignId?: string;
  to: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  messageId?: string;
  error?: string;
  bounced?: boolean;
  bouncedAt?: Date;
  variant?: "a" | "b";
  sentAt: Date;
}

const SendLogSchema = new Schema<ISendLog>(
  {
    campaignId: { type: String, index: true },
    to: { type: String, required: true, lowercase: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed", "skipped"], required: true },
    messageId: { type: String },
    error: { type: String },
    bounced: { type: Boolean, default: false },
    bouncedAt: { type: Date },
    variant: { type: String, enum: ["a", "b"] },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

SendLogSchema.index({ sentAt: -1 });
SendLogSchema.index({ to: 1 });

const SendLog: Model<ISendLog> =
  mongoose.models.SendLog ?? mongoose.model<ISendLog>("SendLog", SendLogSchema);

export default SendLog;

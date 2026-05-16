import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScheduledSend extends Document {
  label: string;
  scheduledAt: Date;
  senderName: string;
  senderEmail: string;
  recipients: Array<{ name: string; email: string }>;
  subject: string;
  htmlBody: string;
  status: "pending" | "sending" | "sent" | "failed" | "cancelled";
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecipientSchema = new Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { _id: false }
);

const ScheduledSendSchema = new Schema<IScheduledSend>(
  {
    label: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    senderName: { type: String, required: true, trim: true },
    senderEmail: { type: String, required: true, lowercase: true, trim: true },
    recipients: { type: [RecipientSchema], default: [] },
    subject: { type: String, required: true, trim: true },
    htmlBody: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "cancelled"],
      default: "pending",
    },
    sentAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

ScheduledSendSchema.index({ scheduledAt: 1, status: 1 });

const ScheduledSend: Model<IScheduledSend> =
  mongoose.models.ScheduledSend ??
  mongoose.model<IScheduledSend>("ScheduledSend", ScheduledSendSchema);

export default ScheduledSend;

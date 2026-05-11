import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrackingEvent extends Document {
  type: "open" | "click";
  sendId: string;
  campaignId?: string;
  email: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  occurredAt: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    type: { type: String, enum: ["open", "click"], required: true },
    sendId: { type: String, required: true, index: true },
    campaignId: { type: String, index: true },
    email: { type: String, required: true, lowercase: true },
    url: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

TrackingEventSchema.index({ occurredAt: -1 });
TrackingEventSchema.index({ email: 1, type: 1 });

const TrackingEvent: Model<ITrackingEvent> =
  mongoose.models.TrackingEvent ??
  mongoose.model<ITrackingEvent>("TrackingEvent", TrackingEventSchema);

export default TrackingEvent;

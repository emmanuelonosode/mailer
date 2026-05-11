import mongoose, { Schema, Document, Model } from "mongoose";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export interface ICampaign extends Document {
  name: string;
  subject: string;
  subjectB?: string;
  html: string;
  segment: string[];
  segmentTag?: string;
  status: CampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  sentCount: number;
  openCount: number;
  clickCount: number;
  unsubscribeCount: number;
  bounceCount: number;
  abTest: boolean;
  abWinner?: "a" | "b";
  followUpEnabled: boolean;
  followUpDays?: number;
  followUpSubject?: string;
  followUpHtml?: string;
  followUpSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    subjectB: { type: String, trim: true },
    html: { type: String, required: true },
    segment: { type: [String], default: [] },
    segmentTag: { type: String },
    status: { type: String, enum: ["draft", "scheduled", "sending", "sent"], default: "draft" },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    unsubscribeCount: { type: Number, default: 0 },
    bounceCount: { type: Number, default: 0 },
    abTest: { type: Boolean, default: false },
    abWinner: { type: String, enum: ["a", "b"] },
    followUpEnabled: { type: Boolean, default: false },
    followUpDays: { type: Number },
    followUpSubject: { type: String },
    followUpHtml: { type: String },
    followUpSentAt: { type: Date },
  },
  { timestamps: true }
);

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign ?? mongoose.model<ICampaign>("Campaign", CampaignSchema);

export default Campaign;

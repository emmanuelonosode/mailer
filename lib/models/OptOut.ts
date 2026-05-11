import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOptOut extends Document {
  email: string;
  reason?: string;
  addedAt: Date;
}

const OptOutSchema = new Schema<IOptOut>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    reason: { type: String },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const OptOut: Model<IOptOut> =
  mongoose.models.OptOut ?? mongoose.model<IOptOut>("OptOut", OptOutSchema);

export default OptOut;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITemplate extends Document {
  name: string;
  subject: string;
  html: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    html: { type: String, required: true },
    category: { type: String, trim: true },
  },
  { timestamps: true }
);

const Template: Model<ITemplate> =
  mongoose.models.Template ?? mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;

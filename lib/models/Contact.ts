import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags: string[];
  notes?: string;
  source?: string;
  city?: string;
  state?: string;
  alertCities?: string[];
  alertMinBeds?: number;
  bounced?: boolean;
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    tags: { type: [String], default: [] },
    notes: { type: String },
    source: { type: String },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    alertCities: { type: [String], default: [] },
    alertMinBeds: { type: Number },
    bounced: { type: Boolean, default: false },
    lastContactedAt: { type: Date },
  },
  { timestamps: true }
);

ContactSchema.index({ email: 1 });
ContactSchema.index({ tags: 1 });
ContactSchema.index({ city: 1 });

const Contact: Model<IContact> =
  mongoose.models.Contact ?? mongoose.model<IContact>("Contact", ContactSchema);

export default Contact;

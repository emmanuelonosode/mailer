import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPropertyCache extends Document {
  url: string;
  data: Record<string, unknown>;
  city: string;
  cachedAt: Date;
}

const PropertyCacheSchema = new Schema<IPropertyCache>(
  {
    url: { type: String, required: true, unique: true },
    data: { type: Schema.Types.Mixed, required: true },
    city: { type: String, required: true, lowercase: true, trim: true },
    cachedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 }, // 7-day TTL
  },
  { timestamps: false }
);

PropertyCacheSchema.index({ city: 1 });

const PropertyCache: Model<IPropertyCache> =
  mongoose.models.PropertyCache ??
  mongoose.model<IPropertyCache>("PropertyCache", PropertyCacheSchema);

export default PropertyCache;

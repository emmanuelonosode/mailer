import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnrollment extends Document {
  sequenceId: string;
  contactId?: string;
  email: string;
  enrolledAt: Date;
  completedSteps: number[];
  active: boolean;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    sequenceId: { type: String, required: true, index: true },
    contactId: { type: String },
    email: { type: String, required: true, lowercase: true, trim: true },
    enrolledAt: { type: Date, default: Date.now },
    completedSteps: { type: [Number], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: false }
);

EnrollmentSchema.index({ sequenceId: 1, email: 1 }, { unique: true });

const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment ?? mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);

export default Enrollment;

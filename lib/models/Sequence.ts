import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDripStep {
  dayOffset: number;
  subject: string;
  html: string;
}

export interface ISequence extends Document {
  name: string;
  steps: IDripStep[];
  createdAt: Date;
  updatedAt: Date;
}

const DripStepSchema = new Schema<IDripStep>(
  {
    dayOffset: { type: Number, required: true },
    subject: { type: String, required: true },
    html: { type: String, required: true },
  },
  { _id: false }
);

const SequenceSchema = new Schema<ISequence>(
  {
    name: { type: String, required: true, trim: true },
    steps: { type: [DripStepSchema], default: [] },
  },
  { timestamps: true }
);

const Sequence: Model<ISequence> =
  mongoose.models.Sequence ?? mongoose.model<ISequence>("Sequence", SequenceSchema);

export default Sequence;

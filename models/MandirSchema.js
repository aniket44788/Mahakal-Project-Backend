import mongoose from "mongoose";

const MandirSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ],

    shortDescription: { type: String, required: true },
    detailedDescription: { type: String },
    history: { type: String },
    pujaInfo: { type: String },
    visitingTips: { type: String },

    location: {
      address: { type: String, required: true },
      city: { type: String },
      state: { type: String },
      country: { type: String, default: "India" },
      googleMapLink: { type: String },
    },

    hours: {
      openingTime: { type: String, required: true },
      closingTime: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// FIX: Prevent model overwrite error
export default mongoose.models.Mandir || mongoose.model("Mandir", MandirSchema);

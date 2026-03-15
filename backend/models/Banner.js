const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    buttonText: {
      type: String,
      default: "",
      trim: true,
    },
    buttonLink: {
      type: String,
      default: "",
      trim: true,
    },
    position: {
      type: String,
      default: "home",
      trim: true,
      lowercase: true,
    },
    device: {
      type: String,
      enum: ["desktop", "mobile"],
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

const mongoose = require("mongoose");

const supportRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    subject: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    locale: { type: String, enum: ["en", "de"], default: "en" },
    source: { type: String, default: "footer", trim: true },
    pageUrl: { type: String, default: "", trim: true },
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SupportRequest || mongoose.model("SupportRequest", supportRequestSchema);


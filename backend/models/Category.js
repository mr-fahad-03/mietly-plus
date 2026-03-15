const mongoose = require("mongoose");

const localizedNameSchema = new mongoose.Schema(
  {
    en: {
      type: String,
      required: true,
      trim: true,
    },
    de: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const localizedHtmlSchema = new mongoose.Schema(
  {
    en: {
      type: String,
      default: "",
      trim: true,
    },
    de: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const categorySeoSchema = new mongoose.Schema(
  {
    metaTitle: {
      type: String,
      default: "",
      trim: true,
    },
    metaDescription: {
      type: String,
      default: "",
      trim: true,
    },
    metaKeywords: {
      type: [String],
      default: [],
    },
    canonicalUrl: {
      type: String,
      default: "",
      trim: true,
    },
    contentHtml: {
      type: localizedHtmlSchema,
      default: () => ({ en: "", de: "" }),
    },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: localizedNameSchema,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      default: null,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    seo: {
      type: categorySeoSchema,
      default: () => ({
        metaTitle: "",
        metaDescription: "",
        metaKeywords: [],
        canonicalUrl: "",
        contentHtml: { en: "", de: "" },
      }),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);

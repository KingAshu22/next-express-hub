import mongoose, { Schema, model, models } from "mongoose";

const BlogSchema = new Schema({
  title: { type: String, required: true },
  metaTitle: String,
  metaDesc: String,
  slug: { type: String, required: true, unique: true },
  keywords: [String],
  content: { type: String, required: true },
}, {
  timestamps: true
});

const Blog = models.Blog || model("Blog", BlogSchema);

export default Blog;
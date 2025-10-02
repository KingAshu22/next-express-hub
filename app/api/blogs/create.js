import { connectToDB } from "@/app/_utils/mongodb";
import Blog from "@/models/Blog";

export default async function handler(req, res) {
  await connectDB();
  
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  
  try {
    const { title, metaTitle, metaDesc, slug, keywords, content } = req.body;
    
    const newBlog = new Blog({
      title,
      metaTitle,
      metaDesc,
      slug,
      keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
      content,
    });
    
    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
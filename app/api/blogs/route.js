import { connectToDB } from "@/app/_utils/mongodb";
import Blog from "@/models/Blog";
import { NextResponse } from "next/server";
import slugify from "slugify";

// ✅ GET blogs with pagination + search
export async function GET(req) {
  await connectToDB();

  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const title = searchParams.get("title") || "";

    const skip = (page - 1) * limit;

    let filter = {};
    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(totalBlogs / limit);

    return NextResponse.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ POST create a new blog
export async function POST(req) {
  await connectToDB();

  try {
    const body = await req.json();
    const { title, metaTitle, metaDesc, slug, keywords, content } = body;

    // Auto-generate slug if missing
    const finalSlug =
      slug && slug.trim() !== ""
        ? slug
        : slugify(title, { lower: true, strict: true });

    const newBlog = new Blog({
      title,
      metaTitle,
      metaDesc,
      slug: finalSlug,
      keywords: keywords
        ? keywords.split(",").map((k) => k.trim())
        : [],
      content,
    });

    const savedBlog = await newBlog.save();
    return NextResponse.json(savedBlog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { connectToDB } from "@/app/_utils/mongodb";
import Blog from "@/models/Blog";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  await connectToDB();

  try {
    const blog = await Blog.findById(params._id);
    if (!blog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  await connectToDB();

  try {
    const body = await request.json();
    const { title, metaTitle, metaDesc, slug, keywords, content } = body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      params._id,
      {
        title,
        metaTitle,
        metaDesc,
        slug,
        keywords: keywords ? keywords.split(",").map(k => k.trim()) : [],
        content,
      },
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error.message);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  await connectToDB();

  try {
    const deletedBlog = await Blog.findByIdAndDelete(params._id);
    if (!deletedBlog) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error.message);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
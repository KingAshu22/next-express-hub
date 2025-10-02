"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import Head from "next/head";

export default function BlogPost() {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams();
  const router = useRouter();

  const slug = params?.slug; // ✅ use slug, not code

  useEffect(() => {
    if (slug) {
      fetchBlog(slug);
    }
  }, [slug]);

  const fetchBlog = async (slugValue) => {
    try {
      const response = await fetch(`/api/blogs/slug/${slugValue}`);
      if (!response.ok) throw new Error("Blog post not found");

      const blogData = await response.json();
      setBlog(blogData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => router.push("/blogs")}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Back to Blog List
        </button>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold">Blog post not found</h2>
        <button
          onClick={() => router.push("/blogs")}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Back to Blog List
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ✅ SEO with Next.js Head */}
      <Head>
        <title>{blog.metaTitle || blog.title}</title>
        {blog.metaDesc && (
          <meta name="description" content={blog.metaDesc} />
        )}
        {blog.keywords && blog.keywords.length > 0 && (
          <meta name="keywords" content={blog.keywords.join(", ")} />
        )}
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>

            {blog.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-b border-gray-200 py-4 mb-8">
              <time className="text-gray-500 text-sm">
                Published on {new Date(blog.createdAt).toLocaleDateString()}
              </time>
            </div>
          </header>

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(blog.content),
            }}
          />

          <footer className="mt-12 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
            >
              ← Back to Blog
            </button>
          </footer>
        </article>
      </div>
    </>
  );
}

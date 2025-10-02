"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    fetchBlogs();
  }, []);
  
  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs");
      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }
      const data = await response.json();
      setBlogs(data.blogs);
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-12">Our Blog</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {blogs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-xl">No blog posts available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div key={blog._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-3 line-clamp-2">
                  <a href={`/blogs/${blog.slug}`} className="hover:text-blue-600">
                    {blog.title}
                  </a>
                </h2>
                
                <div className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {blog.metaDesc || "No description available"}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.keywords && blog.keywords.slice(0, 3).map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {blog.keywords && blog.keywords.length > 3 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      +{blog.keywords.length - 3} more
                    </span>
                  )}
                </div>
                
                <a href={`/blogs/${blog.slug}`} className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Read More
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
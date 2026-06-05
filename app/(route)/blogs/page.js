"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FrontHeader from "../../_components/FrontHeader";
import Footer from "../../_components/Footer";
import FloatingContactButtons from "../../_components/FloatingContactButtons";
import { motion } from "framer-motion";

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
      setBlogs(data.blogs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <FrontHeader />
        <FloatingContactButtons />
        <div className="flex justify-center items-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 border-4 border-violet-200 border-t-purple-900 rounded-full"
          />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <FrontHeader />
      <FloatingContactButtons />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Kargo One Blog
            </h1>
            <p className="text-lg text-gray-600">
              Insights, tips, and news about international shipping
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-lg mb-8"
            >
              {error}
            </motion.div>
          )}

          {blogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-gray-600 text-xl">
                No blog posts available yet. Check back soon for more insights!
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog, idx) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden h-full flex flex-col"
                >
                  {/* Image */}
                  {blog.image && (
                    <div className="w-full h-48 bg-gradient-to-br from-purple-200 to-purple-100 overflow-hidden">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      {blog.createdAt && (
                        <span>
                          {new Date(blog.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                      {blog.category && (
                        <span className="bg-purple-100 px-3 py-1 rounded-full text-xs font-medium text-purple-900">
                          {blog.category}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {blog.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                      {blog.excerpt || blog.content?.substring(0, 150)}...
                    </p>

                    {/* Read More Link */}
                    <Link
                      href={`/blogs/${blog.slug || blog._id}`}
                      className={`inline-flex items-center gap-2 font-semibold text-purple-900 hover:text-purple-700 transition-colors mt-auto`}
                    >
                      Read More →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

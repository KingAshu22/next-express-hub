"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  const router = useRouter();
  
  const fetchBlogs = async (page = 1, title = "") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blogs?page=${page}&title=${title}`);
      const data = await response.json();
      setBlogs(data.blogs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBlogs(pagination.currentPage, searchTerm);
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchBlogs(1, searchTerm);
  };
  
  const handlePageChange = (page) => {
    fetchBlogs(page, searchTerm);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await fetch(`/api/blogs/${id}`, {
          method: "DELETE",
        });
        fetchBlogs(pagination.currentPage, searchTerm);
      } catch (error) {
        console.error("Error deleting blog:", error);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Blogs</h1>
        <a href="/admin-blogs/create" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
            Create New Blog
        </a>
      </div>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title..."
            className="border border-gray-300 rounded-l-md px-4 py-2 w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md"
          >
            Search
          </button>
        </div>
      </form>
      
      {blogs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No blogs found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4 text-left">Slug</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="border-t border-gray-200">
                  <td className="py-3 px-4">{blog.title}</td>
                  <td className="py-3 px-4">{blog.slug}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <a href={`/admin-blogs/${blog._id}`} className="text-blue-500 hover:text-blue-700">
                        Edit
                      </a>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                      <a href={`/blogs/${blog.slug}`} target="_blank" className="text-green-500 hover:text-green-700">
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className={`px-3 py-2 rounded-md ${
                pagination.hasPrevPage
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Previous
            </button>
            
            <span className="px-4 py-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={`px-3 py-2 rounded-md ${
                pagination.hasNextPage
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
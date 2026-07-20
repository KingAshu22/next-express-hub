import Link from "next/link";
import FrontHeader from "../../_components/FrontHeader";
import Footer from "../../_components/Footer";
import FloatingContactButtons from "../../_components/FloatingContactButtons";
import BlogSearchBar from "../../_components/BlogSearchBar";
import { connectToDB } from "../../_utils/mongodb";
import Blog from "@/models/Blog";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const PAGE_SIZE = 9;
const SITE_URL = "https://kargoone.com";

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function excerptFromContent(blog, length = 150) {
  const text = blog.metaDesc || stripHtml(blog.content || "");
  return text.length > length ? text.slice(0, length).trim() + "…" : text;
}

function estimateReadTime(content = "") {
  const words = stripHtml(content).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const q = (params?.q || "").trim();

  const title = q
    ? `Search results for "${q}" | Kargo One Blog`
    : "Blog | Kargo One";
  const description = q
    ? `Search results for "${q}" on the Kargo One blog — insights, tips, and news about international shipping.`
    : "Insights, tips, and news about international shipping, customs, packaging, and logistics from Kargo One.";
  const canonical = `${SITE_URL}/blogs${q ? `?q=${encodeURIComponent(q)}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: q
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Kargo One",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function BlogsPage({ searchParams }) {
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const requestedPage = Math.max(1, parseInt(params?.page || "1", 10) || 1);

  await connectToDB();

  const filter = q ? { title: { $regex: q, $options: "i" } } : {};
  const totalBlogs = await Blog.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(totalBlogs / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const blogs = await Blog.find(filter)
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const buildHref = (pageNum) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (pageNum > 1) sp.set("page", String(pageNum));
    const qs = sp.toString();
    return `/blogs${qs ? `?${qs}` : ""}`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Kargo One Blog",
    url: `${SITE_URL}/blogs`,
    blogPost: blogs.map((b) => ({
      "@type": "BlogPosting",
      headline: b.title,
      url: `${SITE_URL}/blogs/${b.slug}`,
      datePublished: b.createdAt,
      dateModified: b.updatedAt,
    })),
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FrontHeader />
      <FloatingContactButtons />

      {/* Hero Section */}
      <section className="pt-32 pb-10 px-4 md:px-6 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Kargo One Blog
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Insights, tips, and news about international shipping, customs,
              and logistics.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <BlogSearchBar defaultValue={q} />
          </div>

          {q && (
            <p className="mt-4 text-center text-sm text-gray-600">
              {totalBlogs} result{totalBlogs === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-gray-900">"{q}"</span> ·{" "}
              <Link href="/blogs" className="text-purple-700 hover:underline">
                Clear search
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          {blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-xl">
                {q
                  ? `No blog posts found for "${q}". Try a different search term.`
                  : "No blog posts available yet. Check back soon for more insights!"}
              </p>
              {q && (
                <Link
                  href="/blogs"
                  className="inline-block mt-6 text-purple-900 font-semibold hover:underline"
                >
                  View all blog posts
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {blogs.map((blog) => (
                <article
                  key={String(blog._id)}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden h-full flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                      {blog.createdAt && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(blog.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {estimateReadTime(blog.content)} min read
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-900 transition-colors">
                      <Link href={`/blogs/${blog.slug}`}>{blog.title}</Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                      {excerptFromContent(blog)}
                    </p>

                    {/* Keywords */}
                    {blog.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.keywords.slice(0, 3).map((keyword) => (
                          <span
                            key={keyword}
                            className="bg-purple-100 px-2.5 py-1 rounded-full text-xs font-medium text-purple-900"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Read More Link */}
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-purple-900 hover:text-purple-700 transition-colors mt-auto"
                    >
                      Read More <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Blog pagination"
              className="mt-12 flex items-center justify-center gap-2 flex-wrap"
            >
              <Link
                href={buildHref(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? "text-gray-300 border-gray-200 pointer-events-none"
                    : "text-gray-700 border-gray-300 hover:bg-purple-50 hover:border-purple-300"
                }`}
              >
                ← Prev
              </Link>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <Link
                    key={pageNum}
                    href={buildHref(pageNum)}
                    aria-current={pageNum === currentPage ? "page" : undefined}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      pageNum === currentPage
                        ? "bg-purple-900 text-white"
                        : "text-gray-700 border border-gray-300 hover:bg-purple-50 hover:border-purple-300"
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              )}

              <Link
                href={buildHref(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? "text-gray-300 border-gray-200 pointer-events-none"
                    : "text-gray-700 border-gray-300 hover:bg-purple-50 hover:border-purple-300"
                }`}
              >
                Next →
              </Link>
            </nav>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

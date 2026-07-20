import Link from "next/link";
import { notFound } from "next/navigation";
import FrontHeader from "../../../_components/FrontHeader";
import Footer from "../../../_components/Footer";
import FloatingContactButtons from "../../../_components/FloatingContactButtons";
import { connectToDB } from "../../../_utils/mongodb";
import Blog from "@/models/Blog";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

const SITE_URL = "https://kargoone.com";

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateReadTime(content = "") {
  const words = stripHtml(content).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function getBlog(slug) {
  await connectToDB();
  return Blog.findOne({ slug }).lean();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    return { title: "Blog post not found | Kargo One" };
  }

  const title = blog.metaTitle || blog.title;
  const description =
    blog.metaDesc || stripHtml(blog.content || "").slice(0, 160);
  const url = `${SITE_URL}/blogs/${blog.slug}`;

  return {
    title: `${title} | Kargo One`,
    description,
    keywords: blog.keywords?.length ? blog.keywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Kargo One",
      type: "article",
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    keywords: blog.keywords?.join(", "),
    publisher: {
      "@type": "Organization",
      name: "Kargo One",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/blogs/${blog.slug}`,
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FrontHeader />
      <FloatingContactButtons />

      <div className="container mx-auto px-4 py-8 pt-28 md:pt-32 max-w-4xl">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1.5 text-purple-900 font-semibold hover:text-purple-700 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-10">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {blog.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              {blog.createdAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {estimateReadTime(blog.content)} min read
              </span>
            </div>

            {blog.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-200">
                {blog.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="bg-purple-100 text-purple-900 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          <footer className="mt-12 pt-6 border-t border-gray-200">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Blog List
            </Link>
          </footer>
        </article>
      </div>

      <Footer />
    </main>
  );
}

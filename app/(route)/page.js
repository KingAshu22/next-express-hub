import Link from "next/link";
import Hero from "../_components/Hero";
import FrontHeader from "../_components/FrontHeader";
import Footer from "../_components/Footer";
import FloatingContactButtons from "../_components/FloatingContactButtons";
import Services from "../_components/Services";
import WhyChooseUs from "../_components/WhyChooseUs";
import CtaSection from "../_components/CtaSection";
import Testimonials from "../_components/testimonial";
import DeliveryCountries from "../_components/DeliveryCountries";
import ShippableItems from "../_components/ShipableItems";
import BlogSearchBar from "../_components/BlogSearchBar";
import { connectToDB } from "../_utils/mongodb";
import Blog from "@/models/Blog";
import { ArrowRight, Calendar } from "lucide-react";

const SITE_URL = "https://kargoone.com";

export const metadata = {
  title: "Kargo One | International Courier & Shipping Services",
  description:
    "Kargo One is India's trusted international courier partner, shipping parcels to 220+ countries with reliable, affordable door-to-door delivery.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Kargo One | International Courier & Shipping Services",
    description:
      "Ship parcels to 220+ countries with Kargo One's reliable, affordable international courier services.",
    url: SITE_URL,
    siteName: "Kargo One",
    images: [`${SITE_URL}/kargoone-logo.png`],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kargo One | International Courier & Shipping Services",
    description:
      "Ship parcels to 220+ countries with Kargo One's reliable, affordable international courier services.",
  },
};

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function getLatestBlogs() {
  try {
    await connectToDB();
    return await Blog.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
  } catch {
    return [];
  }
}

export default async function Home() {
  const latestBlogs = await getLatestBlogs();

  return (
    <main className="min-h-screen">
      <FrontHeader />
      <Hero />
      <FloatingContactButtons />
      <Services />
      <WhyChooseUs />
      <DeliveryCountries />
      <ShippableItems />
      <Testimonials />

      {/* Blog search + latest posts */}
      <section className="py-16 px-4 md:px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              From Our Blog
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Search our shipping guides, customs tips, and logistics news.
            </p>
            <div className="flex justify-center pt-2">
              <BlogSearchBar />
            </div>
          </div>

          {latestBlogs.length > 0 && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {latestBlogs.map((blog) => (
                  <article
                    key={String(blog._id)}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 p-6 flex flex-col"
                  >
                    {blog.createdAt && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(blog.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-900 transition-colors">
                      <Link href={`/blogs/${blog.slug}`}>{blog.title}</Link>
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                      {blog.metaDesc || stripHtml(blog.content).slice(0, 130)}
                    </p>
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-purple-900 hover:text-purple-700 transition-colors mt-auto text-sm"
                    >
                      Read More <ArrowRight className="w-4 h-4" />
                    </Link>
                  </article>
                ))}
              </div>

              <div className="text-center mt-10">
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-2 bg-purple-900 hover:bg-purple-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  View All Blog Posts <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <CtaSection />
      <Footer />
    </main>
  );
}

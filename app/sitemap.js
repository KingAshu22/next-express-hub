import { connectToDB } from "@/app/_utils/mongodb";
import Blog from "@/models/Blog";

const SITE_URL = "https://kargoone.com";

const STATIC_PAGES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/get-rates", changeFrequency: "weekly", priority: 0.8 },
  { path: "/track", changeFrequency: "monthly", priority: 0.5 },
  { path: "/blogs", changeFrequency: "daily", priority: 0.9 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.3 },
  {
    path: "/refunds-cancellation-policy",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

export default async function sitemap() {
  const staticEntries = STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  let blogEntries = [];
  try {
    await connectToDB();
    const blogs = await Blog.find({}, "slug updatedAt createdAt").lean();
    blogEntries = blogs.map((blog) => ({
      url: `${SITE_URL}/blogs/${blog.slug}`,
      lastModified: blog.updatedAt || blog.createdAt || new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    blogEntries = [];
  }

  return [...staticEntries, ...blogEntries];
}

import { connectToDB } from "@/app/_utils/mongodb";
import Blog from "@/models/Blog";

const SITE_URL = "https://kargoone.com";

export async function GET() {
  let blogLines = "";
  try {
    await connectToDB();
    const blogs = await Blog.find({}, "title slug metaDesc createdAt")
      .sort({ createdAt: -1 })
      .lean();
    blogLines = blogs
      .map(
        (blog) =>
          `- [${blog.title}](${SITE_URL}/blogs/${blog.slug}): ${
            blog.metaDesc || "Shipping and logistics insights from Kargo One."
          }`
      )
      .join("\n");
  } catch {
    blogLines = "";
  }

  const content = `# Kargo One

> Kargo One is India's international courier and shipping partner, helping businesses and individuals ship parcels to 220+ countries with reliable, affordable door-to-door delivery.

Kargo One operates out of Mumbai, India, and has shipped over 10 million parcels since 2010. This file follows the llms.txt convention to help AI assistants and crawlers understand the structure of this site.

## Company

- [Home](${SITE_URL}/): Overview of Kargo One's international courier services.
- [About Us](${SITE_URL}/about): Company history, mission, vision, and values.
- [Contact Us](${SITE_URL}/contact): Phone, email, and address for customer support.
- [Get Shipping Rates](${SITE_URL}/get-rates): Instant international courier rate comparison across carriers.
- [Track a Shipment](${SITE_URL}/track): Track an international parcel by tracking number.

## Policies

- [Privacy Policy](${SITE_URL}/privacy-policy)
- [Terms of Service](${SITE_URL}/terms-of-service)
- [Refunds & Cancellation Policy](${SITE_URL}/refunds-cancellation-policy)

## Blog

- [All Blog Posts](${SITE_URL}/blogs): Insights, tips, and news about international shipping, customs, and logistics.
${blogLines}

## Sitemap

- [XML Sitemap](${SITE_URL}/sitemap.xml)

## Notes for crawlers

- Customer account tools (tracking dashboards, billing, admin panels) are not included above and are disallowed in robots.txt — they are private/internal and not relevant to public knowledge about Kargo One.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}

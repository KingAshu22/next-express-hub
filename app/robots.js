const SITE_URL = "https://kargoone.com";

const DISALLOWED_PATHS = [
  "/api/",
  "/admin-blogs",
  "/awb",
  "/billing",
  "/clients",
  "/customers",
  "/dashboard",
  "/edit-awb",
  "/edit-estimate",
  "/edit-pickup",
  "/estimate",
  "/franchise",
  "/mis",
  "/pickup",
  "/rates",
  "/csv-rate",
  "/pdf-rate",
  "/label",
  "/shipping-and-label",
  "/shipping-invoice",
  "/signin",
  "/settings",
  "/stock",
  "/api",
  "/track/",
];

const rules = {
  userAgent: "*",
  allow: ["/", "/track"],
  disallow: DISALLOWED_PATHS,
};

export default function robots() {
  return {
    rules: [
      rules,
      // Explicitly welcome AI crawlers/assistants onto the public pages.
      { ...rules, userAgent: "GPTBot" },
      { ...rules, userAgent: "ChatGPT-User" },
      { ...rules, userAgent: "OAI-SearchBot" },
      { ...rules, userAgent: "ClaudeBot" },
      { ...rules, userAgent: "Claude-Web" },
      { ...rules, userAgent: "anthropic-ai" },
      { ...rules, userAgent: "PerplexityBot" },
      { ...rules, userAgent: "Google-Extended" },
      { ...rules, userAgent: "CCBot" },
      { ...rules, userAgent: "Bytespider" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

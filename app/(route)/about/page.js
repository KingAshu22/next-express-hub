import AboutClient from "./AboutClient";

export const metadata = {
  title: "About Us | Kargo One",
  description:
    "Kargo One has been India's trusted international courier partner since 2010, shipping over 10 million parcels to 220+ countries with a 99.2% customer satisfaction rate.",
  alternates: { canonical: "https://kargoone.com/about" },
  openGraph: {
    title: "About Kargo One",
    description:
      "Your trusted partner in international shipping since 2010 — 10M+ parcels delivered to 220+ countries.",
    url: "https://kargoone.com/about",
    siteName: "Kargo One",
    images: ["https://kargoone.com/kargoone-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Kargo One",
    description:
      "Your trusted partner in international shipping since 2010 — 10M+ parcels delivered to 220+ countries.",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}

import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact Us | Kargo One",
  description:
    "Get in touch with Kargo One for international shipping and courier support. Call +91 91520 39557 or email support@kargoone.com — our Mumbai team is ready to help.",
  alternates: { canonical: "https://kargoone.com/contact" },
  openGraph: {
    title: "Contact Kargo One",
    description:
      "Reach our international shipping support team by phone, email, or the contact form.",
    url: "https://kargoone.com/contact",
    siteName: "Kargo One",
    images: ["https://kargoone.com/kargoone-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Kargo One",
    description:
      "Reach our international shipping support team by phone, email, or the contact form.",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}

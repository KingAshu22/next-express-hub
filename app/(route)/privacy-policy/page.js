import PrivacyPolicyClient from "./PrivacyPolicyClient";

export const metadata = {
  title: "Privacy Policy | Kargo One",
  description:
    "Read Kargo One's privacy policy to learn how we collect, use, and protect your personal data when you use our international shipping services.",
  alternates: { canonical: "https://kargoone.com/privacy-policy" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | Kargo One",
    description:
      "How Kargo One collects, uses, and protects your personal data.",
    url: "https://kargoone.com/privacy-policy",
    siteName: "Kargo One",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}

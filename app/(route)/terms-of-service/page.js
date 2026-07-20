import TermsOfServiceClient from "./TermsOfServiceClient";

export const metadata = {
  title: "Terms of Service | Kargo One",
  description:
    "Read the terms and conditions that govern your use of Kargo One's website and international shipping services.",
  alternates: { canonical: "https://kargoone.com/terms-of-service" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Service | Kargo One",
    description:
      "Terms and conditions governing use of Kargo One's website and shipping services.",
    url: "https://kargoone.com/terms-of-service",
    siteName: "Kargo One",
    type: "website",
  },
};

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />;
}

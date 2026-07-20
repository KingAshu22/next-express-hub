import GetRatesClient from "./GetRatesClient";

export const metadata = {
  title: "Get International Shipping Rates | Kargo One",
  description:
    "Instantly compare international courier shipping rates across DHL, FedEx, UPS, Aramex and more with Kargo One — covering 220+ countries.",
  alternates: { canonical: "https://kargoone.com/get-rates" },
  openGraph: {
    title: "Get International Shipping Rates | Kargo One",
    description:
      "Compare live international courier rates across major carriers for 220+ countries.",
    url: "https://kargoone.com/get-rates",
    siteName: "Kargo One",
    images: ["https://kargoone.com/kargoone-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get International Shipping Rates | Kargo One",
    description:
      "Compare live international courier rates across major carriers for 220+ countries.",
  },
};

export default function GetRatesPage() {
  return <GetRatesClient />;
}

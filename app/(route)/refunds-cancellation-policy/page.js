import RefundsCancellationClient from "./RefundsCancellationClient";

export const metadata = {
  title: "Refunds & Cancellation Policy | Kargo One",
  description:
    "Learn about Kargo One's refund and cancellation policy for international courier shipments, including timelines for cancellations and refunds.",
  alternates: { canonical: "https://kargoone.com/refunds-cancellation-policy" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Refunds & Cancellation Policy | Kargo One",
    description:
      "Kargo One's policy on shipment cancellations and refund timelines.",
    url: "https://kargoone.com/refunds-cancellation-policy",
    siteName: "Kargo One",
    type: "website",
  },
};

export default function RefundsCancellationPage() {
  return <RefundsCancellationClient />;
}

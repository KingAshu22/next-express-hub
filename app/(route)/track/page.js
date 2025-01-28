"use client";

import Footer from "@/app/_components/Footer";
import FrontHeader from "@/app/_components/FrontHeader";
import TrackingForm from "@/app/_components/TrackingForm";

export default function TrackPage() {
  return (
    <>
      <FrontHeader />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-[#232C65]">
          Track Your Parcel
        </h1>
        <TrackingForm />
      </div>
      <Footer />
    </>
  );
}

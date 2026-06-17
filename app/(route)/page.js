"use client";

import Hero from "../_components/Hero";
import FrontHeader from "../_components/FrontHeader";
import Footer from "../_components/Footer";
import FloatingContactButtons from "../_components/FloatingContactButtons";
import Services from "../_components/Services";
import WhyChooseUs from "../_components/WhyChooseUs";
import CtaSection from "../_components/CtaSection";
import Testimonials from "../_components/testimonial";
import DeliveryCountries from "../_components/DeliveryCountries";
import ShippableItems from "../_components/ShipableItems";

export default function Home() {
  return (
    <main className="min-h-screen">
      <FrontHeader />
      <Hero />
      <FloatingContactButtons />
      <Services />
      <WhyChooseUs />
      <DeliveryCountries />
      <ShippableItems />
      <Testimonials />
      <CtaSection />
      <Footer />
    </main>
  );
}

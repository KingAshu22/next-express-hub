"use client";

import AreasWeServe from "../_components/AreasWeServe";
import CTA from "../_components/Cta";
import Experience from "../_components/Experience";
import Features from "../_components/Features";
import Footer from "../_components/Footer";
import FrontHeader from "../_components/FrontHeader";
import Hero from "../_components/Hero";
import HowWeDoIt from "../_components/HowWeDoIt";
import WhatWeOffer from "../_components/WhatWeOffer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <FrontHeader />
      <Hero />
      <Features />
      <AreasWeServe />
      <WhatWeOffer />
      <HowWeDoIt />
      <Experience />
      <CTA />
      <Footer />
    </main>
  );
}

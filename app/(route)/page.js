"use client";

import { useEffect, useState } from "react";
import Hero from "../_components/Hero";
import FrontHeader from "../_components/FrontHeader";
import Footer from "../_components/Footer";
import FloatingContactButtons from "../_components/FloatingContactButtons";
import Features from "../_components/Features";
import Features2 from "../_components/Features2";
import Services from "../_components/Services";
import HowWeDoIt from "../_components/HowWeDoIt";
import Experience from "../_components/Experience";
import Testimonials from "../_components/testimonial";
import CTA from "../_components/Cta";

export default function Home() {
  return (
    <main className="min-h-screen">
      <FrontHeader />
      <Hero />
      <FloatingContactButtons />
      <Features />
      <Features2 />
      <Services />
      <HowWeDoIt />
      <Experience />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}

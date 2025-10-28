"use client";

import { useEffect, useState } from "react";
import AreasWeServe from "../_components/AreasWeServe";
import CTA from "../_components/Cta";
import Experience from "../_components/Experience";
import Features from "../_components/Features";
import Footer from "../_components/Footer";
import FrontHeader from "../_components/FrontHeader";
import Hero from "../_components/Hero";
import HowWeDoIt from "../_components/HowWeDoIt";
import WhatWeOffer from "../_components/WhatWeOffer";
import Services from "../_components/Services";
import Features2 from "../_components/Features2";

export default function Home() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <main className="min-h-screen">
      <FrontHeader/>
      <Hero />
      <Features />
      <Features2 />
      <AreasWeServe />
      <Services />
      <HowWeDoIt />
      <Experience />
      <CTA />
      <Footer />
    </main>
  );
}

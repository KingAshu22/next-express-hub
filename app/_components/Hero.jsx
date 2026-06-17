"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Shield, Clock, Globe2, Headphones } from "lucide-react";

export default function Hero() {
  const router = useRouter();

  const features = [
    { icon: Shield, label: "Secure", sub: "Packing" },
    { icon: Clock, label: "On-Time", sub: "Delivery" },
    { icon: Globe2, label: "Worldwide", sub: "Coverage" },
    { icon: Headphones, label: "24/7", sub: "Support" },
  ];

  return (
    <section className="relative overflow-hidden flex items-center min-h-screen lg:min-h-0 lg:pt-32 lg:pb-12 lg:h-auto lg:min-h-[820px] pt-28">
      {/* ============ MOBILE BACKGROUND (SVG) ============ */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <Image
          src="/hero-mobile.gif"
          alt="Kargo One Mobile Background"
          fill
          priority
          className="object-cover object-center w-full h-full"
        />
        {/* Mobile overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/70 via-blue-900/40 to-blue-950/70" />
      </div>

      {/* ============ DESKTOP BACKGROUND (GIF) ============ */}
      <div className="absolute inset-0 z-0 hidden lg:block">
        <Image
          src="/hero.gif"
          alt="Kargo One Worldwide Delivery"
          fill
          unoptimized
          priority
          className="object-cover object-center"
        />
        {/* Desktop left-side dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-900/60 to-transparent" />
        {/* Bottom subtle fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-blue-950/40 to-transparent" />
      </div>

      {/* Soft glows (desktop only) */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 z-0 hidden lg:block" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-yellow-400 rounded-full blur-3xl opacity-10 z-0 hidden lg:block" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center -mt-48 lg:-mt-0">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-white space-y-6 text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-2xl">
              Experience{" "}
              <span className="text-yellow-400">Fast & Hassle</span> Free
              <br />
              Delivery Worldwide
            </h1>

            <div className="w-16 h-1 bg-yellow-400 rounded-full mx-auto lg:mx-0" />

            <p className="text-base md:text-lg text-blue-50 max-w-lg mx-auto lg:mx-0 leading-relaxed drop-shadow-lg">
              Enjoy doorstep pickup, secure packing, and trusted delivery to
              destinations across the globe.
            </p>

            <div className="flex flex-wrap gap-2 lg:gap-4 pt-2 justify-center lg:justify-start">
              <button
                onClick={() => router.push("/contact")}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105 group"
              >
                Get a Quote
                <span className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 text-yellow-400" />
                </span>
              </button>
              <button
                onClick={() => router.push("/track")}
                className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white/40 hover:border-white text-white font-semibold rounded-xl transition-all hover:bg-white/10 backdrop-blur-sm"
              >
                Track Shipment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Feature Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 justify-center lg:justify-start"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-yellow-400/60 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-sm text-left">
                    <p className="text-white font-semibold leading-tight drop-shadow-md">
                      {f.label}
                    </p>
                    <p className="text-blue-100 text-xs drop-shadow-md">
                      {f.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
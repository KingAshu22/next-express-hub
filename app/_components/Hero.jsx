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
    <section className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 overflow-hidden pt-28 md:pt-32 pb-12">
      {/* World Map Dotted Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Soft glows */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-yellow-400 rounded-full blur-3xl opacity-10" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-white space-y-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Experience{" "}
              <span className="text-yellow-400">Fast & Hassle</span> Free
              <br />
              Delivery Worldwide
            </h1>

            <div className="w-16 h-1 bg-yellow-400 rounded-full" />

            <p className="text-base md:text-lg text-blue-100 max-w-lg leading-relaxed">
              Enjoy doorstep pickup, secure packing, and trusted delivery to
              destinations across the globe.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
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
                className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white/30 hover:border-white text-white font-semibold rounded-xl transition-all hover:bg-white/10"
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
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-yellow-400/40 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-sm">
                    <p className="text-white font-semibold leading-tight">
                      {f.label}
                    </p>
                    <p className="text-blue-200 text-xs">{f.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-[400px] md:h-[520px] lg:h-[600px]"
          >
            <Image
              src="/kargo-hero-2.png"
              alt="Kargo One Delivery"
              fill
              className="object-contain object-center"
              priority
            />

            {/* Floating Tracking Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="absolute bottom-6 left-2 md:left-0 bg-white rounded-2xl shadow-2xl p-4 md:p-5 w-64 md:w-72 hidden sm:block"
            >
              <p className="text-xs font-semibold text-blue-700">
                Estimated Delivery Date
              </p>
              <p className="text-xs text-slate-500 mt-1">Thursday</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-700 mt-1">
                10 Dec 2026
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Your Order Is{" "}
                <span className="text-blue-700 font-semibold">
                  Out for Delivery
                </span>
              </p>
              <div className="flex items-center justify-between mt-4">
                {["Confirmed", "In Transit", "Out", "Delivered"].map((s, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        i <= 2 ? "bg-yellow-400" : "bg-gray-300"
                      }`}
                    />
                    <p className="text-[10px] text-slate-600 mt-1">{s}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
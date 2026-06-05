"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      setIsLoading(true);
      router.push(`/track/${trackingNumber}`);
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const features = [
    { icon: "📦", label: "10M+ Parcels" },
    { icon: "🌍", label: "220+ Countries" },
    { icon: "⭐", label: "99.2% Rating" },
  ];

  return (
    <section className="relative bg-white overflow-hidden pt-24">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-slate-100 rounded-full blur-3xl opacity-40"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-slate-100 rounded-full blur-3xl opacity-30"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <motion.div className="space-y-8" variants={itemVariants}>
            {/* Badge */}
            <motion.div className="inline-block" variants={itemVariants}>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 w-fit">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Trusted by Thousands
                </span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-tight">
                Ship Globally
                <br />
                <span className="text-slate-700">At Local Prices</span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              className="text-lg text-slate-600 max-w-lg leading-relaxed"
              variants={itemVariants}
            >
              Fast, reliable, and affordable international shipping to 220+ countries. Real-time tracking and 24/7 support.
            </motion.p>

            {/* Search Form */}
            <motion.form
              onSubmit={handleTrack}
              className="space-y-4"
              variants={itemVariants}
            >
              <label htmlFor="tracking" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Track Your Shipment
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    id="tracking"
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition bg-white text-sm"
                  />
                  <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all whitespace-nowrap"
                >
                  {isLoading ? "Tracking..." : "Track"}
                </Button>
              </div>
            </motion.form>

            {/* Features */}
            <motion.div
              className="flex flex-wrap gap-6 pt-4"
              variants={itemVariants}
            >
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-sm text-slate-700 font-medium">
                    {feature.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Animated Visual */}
          <motion.div
            className="relative hidden lg:flex items-center justify-center h-full"
            variants={itemVariants}
          >
            <div className="relative w-full max-w-md">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 rounded-3xl blur-2xl opacity-60" />

              {/* Main card */}
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 rounded-t-3xl" />

                {/* Content */}
                <motion.div
                  className="space-y-6"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Icon */}
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      Fastest Delivery
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Express shipping with real-time tracking, insurance coverage, and 24/7 customer support.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    {[
                      "✓ 24/7 Live Support",
                      "✓ Real-time Tracking",
                      "✓ Fully Insured"
                    ].map((item, idx) => (
                      <p key={idx} className="text-sm text-slate-700 font-medium">
                        {item}
                      </p>
                    ))}
                  </div>
                </motion.div>

                {/* Floating elements */}
                <motion.div
                  className="absolute -top-4 -right-4 w-12 h-12 bg-slate-200 rounded-full opacity-40"
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-4 -left-4 w-16 h-16 bg-slate-200 rounded-full opacity-30"
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

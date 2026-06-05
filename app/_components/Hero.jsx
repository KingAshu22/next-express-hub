"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRateIndex, setCurrentRateIndex] = useState(0);

  const rates = [
    { name: "United States", flag: "🇺🇸", rate: "650" },
    { name: "United Kingdom", flag: "🇬🇧", rate: "620" },
    { name: "Canada", flag: "🇨🇦", rate: "680" },
    { name: "Australia", flag: "🇦🇺", rate: "720" },
    { name: "UAE", flag: "🇦🇪", rate: "580" },
    { name: "Singapore", flag: "🇸🇬", rate: "640" },
    { name: "Germany", flag: "🇩🇪", rate: "630" },
    { name: "France", flag: "🇫🇷", rate: "630" },
    { name: "Japan", flag: "🇯🇵", rate: "700" },
    { name: "China", flag: "🇨🇳", rate: "660" },
    { name: "Saudi Arabia", flag: "🇸🇦", rate: "590" },
    { name: "Netherlands", flag: "🇳🇱", rate: "640" },
  ];

  // Rotate through rates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRateIndex((prev) => (prev + 1) % rates.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const currentRate = rates[currentRateIndex];

  return (
    <section className="relative bg-white overflow-hidden pt-24">
      {/* Subtle background with purple accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-40"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30"
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
              <div className="flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200 w-fit">
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                  Trusted by Thousands
                </span>
              </div>
            </motion.div>

            {/* Main Heading with Dynamic Rates */}
            <motion.div variants={itemVariants}>
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-purple-900 leading-tight">
                  Ship to {currentRate.name}
                </h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-bold text-purple-600">
                    @ ₹{currentRate.rate}
                  </span>
                  <span className="text-2xl text-purple-600 font-semibold">/kg</span>
                  <span className="text-4xl ml-2">{currentRate.flag}</span>
                </div>
              </div>
            </motion.div>

            {/* Subheading */}
            <motion.p
              className="text-lg text-purple-700 max-w-lg leading-relaxed"
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
              <label htmlFor="tracking" className="block text-xs font-semibold text-purple-600 uppercase tracking-wider">
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
                    className="w-full px-4 py-3 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition bg-white text-sm"
                  />
                  <Search className="absolute right-3 top-3.5 w-4 h-4 text-purple-400" />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-purple-900 hover:bg-purple-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Track"}
                </Button>
              </div>
            </motion.form>

            {/* Features Stats */}
            <motion.div className="space-y-4 pt-4" variants={itemVariants}>
              <div className="grid grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-3xl mb-2">{feature.icon}</div>
                    <p className="text-sm font-semibold text-purple-900">
                      {feature.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content */}
          <motion.div
            className="relative h-full hidden lg:flex items-center justify-center"
            variants={itemVariants}
          >
            <motion.div
              className="relative w-full max-w-md h-96"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Outer glow circle */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-purple-300 rounded-3xl blur-2xl opacity-60" />

              {/* Main card */}
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-purple-200">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-3xl" />

                {/* Content inside card */}
                <div className="space-y-6">
                  {/* Icon circle */}
                  <motion.div
                    className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full opacity-20" />
                  </motion.div>

                  {/* Text content */}
                  <div>
                    <h3 className="text-2xl font-bold text-purple-900 mb-2">
                      Global Shipping Made Easy
                    </h3>
                    <p className="text-purple-700 text-sm">
                      With real-time tracking, competitive pricing, and 24/7 support, we deliver excellence.
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 pt-4">
                    {[
                      "24/7 Customer Support",
                      "Real-time Tracking",
                      "Insured Shipments"
                    ].map((feature, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                      >
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-purple-700 font-medium">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  className="absolute -top-4 -right-4 w-12 h-12 bg-purple-500 rounded-full opacity-20"
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-500 rounded-full opacity-20"
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

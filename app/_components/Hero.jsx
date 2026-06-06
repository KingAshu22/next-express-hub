"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const HeroSection = () => {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [currentRateIndex, setCurrentRateIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");

  const rates = [
    "Ship to Germany @ ₹630*/kg",
    "Ship to USA @ ₹650*/kg",
    "Ship to UK @ ₹640*/kg",
    "Ship to Australia @ ₹680*/kg",
    "Ship to Singapore @ ₹620*/kg",
    "Ship to UAE @ ₹600*/kg",
  ];

  const currentText = rates[currentRateIndex];

  // Typewriter effect
  useEffect(() => {
    if (displayText.length < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(currentText.slice(0, displayText.length + 1));
      }, 60);
      return () => clearTimeout(timeout);
    } else {
      // After text is fully displayed, wait before rotating
      const timeout = setTimeout(() => {
        setCurrentRateIndex((prev) => (prev + 1) % rates.length);
        setDisplayText("");
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [displayText, currentText]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      router.push(`/track?id=${trackingNumber}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 overflow-hidden pt-24 pb-20">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-700 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <motion.div className="space-y-8 text-white" variants={itemVariants}>
            {/* Badge */}
            <div className="inline-block">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">Trusted Since 2010</span>
              </div>
            </div>

            {/* Main Heading */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                Global Shipping,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500 mt-2">
                  Exceptional Rates
                </span>
              </h1>
              <div className="text-xl md:text-2xl font-semibold text-blue-100 min-h-[3.5rem]">
                {displayText}
                <span className="animate-pulse">|</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-lg text-blue-100 leading-relaxed max-w-md">
              Send packages to 220+ countries with real-time tracking, competitive rates, and 24/7 support. Experience seamless international shipping.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => router.push("/contact")}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Start Shipping
              </button>
              <button
                onClick={handleTrack}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
              >
                Track Package
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <motion.div variants={itemVariants}>
                <p className="text-3xl font-bold text-white">10M+</p>
                <p className="text-sm text-blue-200 mt-1">Parcels Shipped</p>
              </motion.div>
              <motion.div variants={itemVariants}>
                <p className="text-3xl font-bold text-white">220+</p>
                <p className="text-sm text-blue-200 mt-1">Countries Served</p>
              </motion.div>
              <motion.div variants={itemVariants}>
                <p className="text-3xl font-bold text-white">99.2%</p>
                <p className="text-sm text-blue-200 mt-1">Satisfaction Rate</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Illustration Card */}
          <motion.div className="hidden lg:flex items-center justify-center" variants={itemVariants}>
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-blue-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-t-3xl"></div>
                <div className="space-y-6">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-white">Fast & Reliable</p>
                    <p className="text-sm text-blue-100">International Shipping</p>
                  </div>
                  <div className="space-y-4 pt-4">
                    {[
                      { icon: "✓", text: "Real-time Tracking" },
                      { icon: "✓", text: "Insured Shipments" },
                      { icon: "✓", text: "24/7 Support" },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <span className="text-sm text-blue-100 font-medium">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

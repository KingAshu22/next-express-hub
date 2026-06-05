"use client";

import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeContext } from "./ThemeProvider";

const countryCodeMap = {
  "United States": "US",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Australia": "AU",
  "UAE": "AE",
  "Singapore": "SG",
  "Germany": "DE",
  "France": "FR",
  "Japan": "JP",
  "China": "CN",
  "Saudi Arabia": "SA",
  "Netherlands": "NL",
};

const HeroSection = () => {
  const router = useRouter();
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || {
    light: 'bg-purple-100',
    text: 'text-purple-900',
    button: 'bg-purple-900 hover:bg-purple-800',
    border: 'border-purple-200',
  };
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRateIndex, setCurrentRateIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");

  const rates = [
    { name: "United States", rate: "650" },
    { name: "United Kingdom", rate: "620" },
    { name: "Canada", rate: "680" },
    { name: "Australia", rate: "720" },
    { name: "UAE", rate: "580" },
    { name: "Singapore", rate: "640" },
    { name: "Germany", rate: "630" },
    { name: "France", rate: "630" },
    { name: "Japan", rate: "700" },
    { name: "China", rate: "660" },
    { name: "Saudi Arabia", rate: "590" },
    { name: "Netherlands", rate: "640" },
  ];

  const currentRate = rates[currentRateIndex];
  const fullText = `Ship to ${currentRate.name} @ ₹${currentRate.rate}*/kg`;

  // Typewriter effect
  useEffect(() => {
    if (displayText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length + 1));
      }, 60);
      return () => clearTimeout(timeout);
    }
  }, [displayText, fullText]);

  // Rotate rates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRateIndex((prev) => (prev + 1) % rates.length);
      setDisplayText("");
    }, 5000);
    return () => clearInterval(interval);
  }, [rates.length]);

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

  return (
    <section className="relative bg-white overflow-hidden pt-24">
      {/* Background elements with theme color */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={`absolute top-0 right-0 w-96 h-96 ${colors.light} rounded-full blur-3xl opacity-40`}
          animate={{ x: [0, 30, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute bottom-10 left-20 w-96 h-96 ${colors.light} rounded-full blur-3xl opacity-30`}
          animate={{ x: [0, -30, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <motion.div className="space-y-8" variants={itemVariants}>
            {/* Badge */}
            <motion.div className="inline-block" variants={itemVariants}>
              <div className={`flex items-center gap-2 ${colors.light} px-4 py-2 rounded-full ${colors.border} border`}>
                <span className="text-sm font-medium">Industry-Leading Service Since 2010</span>
              </div>
            </motion.div>

            {/* Main Heading with Typewriter */}
            <motion.div variants={itemVariants}>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Fast, Reliable
                  <span className={`block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-red-600`}>
                    International Shipping
                  </span>
                </h1>
                <div className={`text-2xl md:text-3xl font-semibold min-h-[3.5rem] ${colors.text}`}>
                  {displayText}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            </motion.div>

            {/* Subheading */}
            <motion.p
              className="text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed"
              variants={itemVariants}
            >
              Ship to 220+ countries at unbeatable rates. Track your parcels in real-time with full transparency and professional support.
            </motion.p>

            {/* Search Form */}
            <motion.form
              onSubmit={handleTrack}
              className="space-y-4"
              variants={itemVariants}
            >
              <label htmlFor="tracking" className="block text-sm font-semibold text-gray-700">
                Track Your Parcel
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    id="tracking"
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                  <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-3 ${colors.button} text-white rounded-lg font-semibold transition transform hover:scale-105 disabled:opacity-50`}
                >
                  {isLoading ? "Loading..." : "Track"}
                </Button>
              </div>
            </motion.form>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200"
              variants={itemVariants}
            >
              <div className="text-center lg:text-left">
                <p className="text-2xl md:text-3xl font-bold text-gray-900">10M+</p>
                <p className="text-sm text-gray-600 mt-1">Parcels Shipped</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl md:text-3xl font-bold text-gray-900">220+</p>
                <p className="text-sm text-gray-600 mt-1">Countries</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl md:text-3xl font-bold text-gray-900">99.2%</p>
                <p className="text-sm text-gray-600 mt-1">Satisfaction</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Info Card */}
          <motion.div
            className="relative h-full hidden lg:flex items-center justify-center"
            variants={itemVariants}
          >
            <motion.div
              className="relative w-full max-w-md h-96"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 ${colors.light} rounded-3xl blur-2xl opacity-60`} />

              {/* Main card */}
              <div className={`relative bg-white rounded-3xl p-8 shadow-2xl ${colors.border} border`}>
                {/* Top accent line with theme color */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${colors.primary} rounded-t-3xl`} />

                {/* Content */}
                <div className="space-y-6">
                  <motion.div
                    className={`w-16 h-16 ${colors.light} rounded-full flex items-center justify-center`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <div className={`w-12 h-12 ${colors.primary} rounded-full opacity-20`} />
                  </motion.div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Seamless Global Shipping
                    </h3>
                    <p className="text-gray-600 text-sm">
                      With real-time tracking, competitive pricing, and 24/7 support, we deliver your parcels with excellence.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    {[
                      "24/7 Customer Support",
                      "Real-time Parcel Tracking",
                      "Insured Shipments"
                    ].map((feature, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                      >
                        <div className={`w-5 h-5 rounded-full ${colors.primary} flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  className={`absolute -top-4 -right-4 w-12 h-12 ${colors.primary} rounded-full opacity-20`}
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className={`absolute -bottom-4 -left-4 w-16 h-16 ${colors.light} rounded-full opacity-20`}
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

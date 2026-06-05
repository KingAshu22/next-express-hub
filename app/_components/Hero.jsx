"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, CheckCircle } from "lucide-react";
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
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const stats = [
    { label: "Parcels Shipped", value: "10M+" },
    { label: "Delivery Countries", value: "220+" },
    { label: "Customer Satisfaction", value: "99.2%" },
  ];

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-hidden pt-32">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-20"
          animate={{ x: [0, 30, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 left-20 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-20"
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
            <motion.div
              className="inline-block"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Industry-Leading Service Since 2010
                </span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
                Fast, Reliable
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">
                  International Shipping
                </span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed"
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
              <label htmlFor="tracking" className="block text-sm font-semibold text-slate-700">
                Track Your Parcel
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    id="tracking"
                    type="text"
                    placeholder="Enter tracking number (e.g., ABC123456)"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white rounded-lg font-semibold transition transform hover:scale-105 disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Track"}
                </Button>
              </div>
            </motion.form>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200"
              variants={itemVariants}
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Modern Shape with No Image */}
          <motion.div
            className="relative h-full hidden lg:flex items-center justify-center"
            variants={itemVariants}
          >
            {/* Main rounded shape */}
            <motion.div
              className="relative w-full max-w-md h-96"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Outer glow circle */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-red-200 rounded-3xl blur-2xl opacity-60" />

              {/* Main card */}
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-red-600 rounded-t-3xl" />

                {/* Content inside card */}
                <div className="space-y-6">
                  {/* Icon circle */}
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-r from-blue-100 to-red-100 rounded-full flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-red-600 rounded-full opacity-20" />
                  </motion.div>

                  {/* Text content */}
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      Seamless Global Shipping
                    </h3>
                    <p className="text-slate-600 text-sm">
                      With real-time tracking, competitive pricing, and 24/7 support, we deliver your parcels with excellence.
                    </p>
                  </div>

                  {/* Features list */}
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
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Floating elements around card */}
                <motion.div
                  className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-full opacity-20"
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-4 -left-4 w-16 h-16 bg-red-500 rounded-full opacity-20"
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Package, Globe, CheckCircle } from "lucide-react";

const HeroSection = () => {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      router.push(`/track/${trackingNumber}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden pt-32 pb-0">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-yellow-500 rounded-full blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-700 rounded-full blur-3xl opacity-5"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <motion.div className="space-y-6 text-white pt-8 lg:pt-0" variants={itemVariants}>
            {/* Main Heading */}
            <div className="space-y-4">
              <motion.h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
                variants={itemVariants}
              >
                Delivering More
                <span className="block text-yellow-400 mt-2">Than Just Packages</span>
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-lg"
                variants={itemVariants}
              >
                Fast, reliable and secure logistics solutions tailored for your business and beyond.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-4"
              variants={itemVariants}
            >
              <button 
                onClick={() => router.push("/contact")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg group"
              >
                Schedule a Pickup
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => router.push("/track")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 hover:border-white text-white font-bold rounded-lg transition-all duration-300 text-lg group"
              >
                Track Your Shipment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              className="grid grid-cols-3 gap-6 pt-12 border-t border-gray-600"
              variants={itemVariants}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-yellow-400" />
                  <p className="text-3xl font-bold text-white">10M+</p>
                </div>
                <p className="text-sm text-gray-300">Deliveries</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-6 h-6 text-yellow-400" />
                  <p className="text-3xl font-bold text-white">220+</p>
                </div>
                <p className="text-sm text-gray-300">Countries</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-yellow-400" />
                  <p className="text-3xl font-bold text-white">99.9%</p>
                </div>
                <p className="text-sm text-gray-300">On-time Delivery</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Hero Image */}
          <motion.div 
            className="relative w-full h-96 md:h-[500px] lg:h-[600px]"
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src="/kargo-hero.png"
              alt="Kargo One - Express Delivery with Truck and Globe"
              fill
              className="object-contain object-right"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Tracking Widget */}
        <motion.div 
          className="mt-16 md:mt-24 -mb-8 md:-mb-16 relative z-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto">
            <h3 className="text-slate-900 font-semibold text-lg md:text-xl mb-4">Track Your Shipment</h3>
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Enter Tracking ID"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-5 py-3 rounded-lg bg-gray-50 text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all border border-gray-200 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={!trackingNumber.trim()}
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap flex items-center justify-center gap-2 group"
              >
                Track Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;

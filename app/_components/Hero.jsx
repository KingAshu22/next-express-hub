"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Shield, Clock, Globe, Headphones, Package, Truck, Plane, CheckCircle } from "lucide-react";

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
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 overflow-hidden pt-24 pb-32">
      {/* Animated background with dotted world map pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dotted world map SVG background */}
        <svg className="absolute w-full h-full opacity-20" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
          {/* Create dotted world map pattern */}
          <defs>
            <pattern id="dots" x="10" y="10" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="currentColor" className="text-blue-400"/>
            </pattern>
          </defs>
          <rect width="1000" height="600" fill="url(#dots)" opacity="0.3"/>
        </svg>

        {/* Delivery route line with pins animation */}
        <svg className="absolute w-full h-full opacity-40 top-0 left-0" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
              <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {/* Curved delivery route */}
          <path d="M 100 300 Q 300 200 500 250 T 900 200" stroke="url(#routeGradient)" strokeWidth="2" strokeDasharray="5,5" fill="none" className="animate-pulse"/>
          {/* Location pins */}
          <circle cx="100" cy="300" r="12" fill="#FBBF24"/>
          <circle cx="100" cy="300" r="8" fill="none" stroke="#FBBF24" strokeWidth="2" className="animate-pulse"/>
          <circle cx="500" cy="250" r="12" fill="#FBBF24"/>
          <circle cx="500" cy="250" r="8" fill="none" stroke="#FBBF24" strokeWidth="2" className="animate-pulse"/>
          <circle cx="900" cy="200" r="12" fill="#FBBF24"/>
          <circle cx="900" cy="200" r="8" fill="none" stroke="#FBBF24" strokeWidth="2" className="animate-pulse"/>
        </svg>

        {/* Glow effects */}
        <div className="absolute top-20 right-32 w-64 h-64 bg-yellow-400 rounded-full blur-3xl opacity-5 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[600px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Content */}
          <motion.div className="space-y-6 text-white" variants={itemVariants}>
            {/* Main Heading */}
            <div className="space-y-4">
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                variants={itemVariants}
              >
                Experience
                <br />
                <span className="text-yellow-400">Fast & Hassle Free</span>
                <br />
                Delivery Worldwide
              </motion.h1>
              <div className="w-16 h-1 bg-yellow-400 rounded-full"></div>
              <motion.p 
                className="text-base md:text-lg text-gray-100 leading-relaxed max-w-lg"
                variants={itemVariants}
              >
                Enjoy doorstep pickup, secure packing, and trusted delivery to destinations across the globe.
              </motion.p>
            </div>

            {/* CTA Button */}
            <motion.div variants={itemVariants}>
              <button 
                onClick={() => router.push("/contact")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-base group"
              >
                Get a Quote
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Stats Grid - Bottom */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-blue-400/30"
              variants={itemVariants}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm font-semibold text-white">Secure Packing</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm font-semibold text-white">On-Time Delivery</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm font-semibold text-white">Worldwide Coverage</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm font-semibold text-white">24/7 Support</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Hero Image with Delivery Card */}
          <motion.div 
            className="relative w-full h-full flex flex-col items-center justify-center gap-6"
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Delivery Status Card */}
            <motion.div 
              className="absolute top-20 left-0 md:relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-80 z-20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Estimated Delivery Date</p>
                  <p className="text-xs text-gray-500 mt-1">Thursday</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-lg font-bold">kargo</span>
                    <span className="text-blue-600 font-bold">one</span>
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-blue-900 mb-2">10 Dec 2026</h3>
              <p className="text-sm text-blue-600 font-semibold mb-4">Your Order Is <span className="text-blue-600">Out for Delivery</span></p>

              {/* Progress bar with icons */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center mb-1">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-700 font-medium">Confirmed</p>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center mb-1">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-700 font-medium">In Transit</p>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mb-1">
                      <Plane className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-blue-600 font-semibold">Out for Delivery</p>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mb-1">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Delivered</p>
                  </div>
                </div>
                {/* Progress line */}
                <div className="flex gap-1 mt-2">
                  <div className="flex-1 h-1 bg-yellow-400 rounded"></div>
                  <div className="flex-1 h-1 bg-yellow-400 rounded"></div>
                  <div className="flex-1 h-1 bg-blue-600 rounded"></div>
                  <div className="flex-1 h-1 bg-gray-300 rounded"></div>
                </div>
              </div>
            </motion.div>

            {/* Main Hero Image - Airplane and Person */}
            <motion.div 
              className="relative w-full h-96 md:h-[500px] mt-12 md:mt-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Image
                src="/hero-delivery.png"
                alt="Kargo One - Express Delivery with Airplane and Delivery Person"
                fill
                className="object-contain object-right md:object-center"
                priority
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;

"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Shield, Headphones } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const features = [
  {
    icon: CheckCircle2,
    title: "Reliable & Fast",
    description: "On-time delivery is our promise.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Delivering to 220+ countries worldwide.",
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "Your cargo is always in safe hands.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "We're here to help you anytime.",
  },
];

function Globe(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function WhyChooseUs() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true }}
          >
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">WHY CHOOSE US</p>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                We Deliver Trust,
                <span className="block text-blue-600">On Time</span>
              </h2>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed">
              With a customer-first approach and advanced logistics network, we ensure your shipments reach safely and on time, every time.
            </p>

            {/* Features */}
            <motion.div
              className="space-y-4"
              variants={containerVariants}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex gap-4 items-start"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mt-1 shadow-lg">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.button
              variants={itemVariants}
              onClick={() => window.location.href = "/about"}
              className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg group"
            >
              Learn More About Us
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </motion.div>

          {/* Right Content - Video/Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-96 md:h-[500px] bg-gradient-to-br from-blue-600 to-slate-900 flex items-center justify-center group cursor-pointer">
              {/* <Image
                src="https://images.unsplash.com/photo-1553531088-d3cf44b60df2?w=800&q=80"
                alt="Kargo One Package Delivery"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              /> */}
              
              {/* Play Button Overlay */}
              <motion.button
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                className="absolute z-10 w-20 h-20 rounded-full bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-8 h-8 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.button>

              {/* Watch Our Video text */}
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-white font-semibold text-lg drop-shadow-lg">
                  Watch Our Video
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

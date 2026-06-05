"use client";

import { motion } from "framer-motion";
import { Truck, Globe, Clock, Shield, File, Luggage, Pill, LibraryBig, ShoppingCart, Import } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Door-to-Door Express",
    description: "Pickup and delivery to any location",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Shipping to 220+ countries",
  },
  {
    icon: Clock,
    title: "Fast Transit Times",
    description: "Express delivery guaranteed",
  },
  {
    icon: Shield,
    title: "Secure Shipping",
    description: "Full tracking and insurance",
  },
  {
    icon: File,
    title: "Document Delivery",
    description: "International documents",
  },
  {
    icon: Luggage,
    title: "Baggage Services",
    description: "Excess & unaccompanied bags",
  },
  {
    icon: Pill,
    title: "Medicine Delivery",
    description: "Specialized shipping",
  },
  {
    icon: LibraryBig,
    title: "Student Services",
    description: "Student essentials",
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce Services",
    description: "Business shipping solutions",
  },
  {
    icon: Import,
    title: "Import Express",
    description: "Import & customs clearance",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function Features() {
  return (
    <section id="services" className="py-20 bg-purple-50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 space-y-3"
          initial={{ opacity: 0, y: -15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-purple-900">
            Our Services
          </h2>
          <p className="text-purple-600 max-w-2xl mx-auto">
            Comprehensive shipping solutions for every need
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className="h-full bg-white rounded-xl p-5 border border-purple-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-900 group-hover:text-white transition-all">
                  <feature.icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <h3 className="text-sm font-semibold text-purple-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-purple-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

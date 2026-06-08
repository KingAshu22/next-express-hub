"use client";

import { motion } from "framer-motion";
import { Package, Plane, Ship, Warehouse, Truck, FileText, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Package,
    title: "Express Delivery",
    description: "Fast door-to-door delivery with real-time tracking.",
  },
  {
    icon: Plane,
    title: "Air Freight",
    description: "Global air cargo solutions for urgent shipments.",
  },
  {
    icon: Ship,
    title: "Sea Freight",
    description: "Cost-effective sea freight services worldwide.",
  },
  {
    icon: Warehouse,
    title: "Warehousing",
    description: "Secure & smart warehousing solutions for your goods.",
  },
  {
    icon: Truck,
    title: "Surface Transport",
    description: "Reliable road transport across cities and countries.",
  },
  {
    icon: FileText,
    title: "Customs Clearance",
    description: "Hassle-free customs clearance with expert support.",
  },
];

export default function Services() {
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
    <section id="services" className="relative z-0 pt-32 md:pt-40 pb-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">WHAT WE OFFER</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            Logistics Solutions That
            <span className="block text-blue-600">Move Your Business Forward</span>
          </h2>
        </motion.div>

        {/* Services Grid - 6 columns on desktop */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group h-full"
            >
              <div className="relative h-full p-8 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <service.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Learn More Link */}
                <button className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group/link transition-colors">
                  Learn More
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </button>

                {/* Hover accent line */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-br-2xl group-hover:w-full transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

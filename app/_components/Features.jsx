"use client";

import { motion } from "framer-motion";
import { Truck, Globe, Clock, Shield, File, Luggage, Pill, LibraryBig, ShoppingCart, Import } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Door-to-Door Express",
    description: "Pickup and delivery to any location worldwide",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "International shipping to 220+ countries",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Clock,
    title: "Fast Transit Times",
    description: "Express delivery with guaranteed dates",
    color: "from-green-500 to-green-600",
  },
  {
    icon: Shield,
    title: "Secure Shipping",
    description: "Full tracking and insurance coverage",
    color: "from-red-500 to-red-600",
  },
  {
    icon: File,
    title: "Document Delivery",
    description: "International documents safely delivered",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Luggage,
    title: "Baggage Services",
    description: "Excess & unaccompanied baggages",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    icon: Pill,
    title: "Medicine Delivery",
    description: "Specialized medicine shipping services",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: LibraryBig,
    title: "Student Services",
    description: "Student essentials and supplies",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce Services",
    description: "Business and retail shipping solutions",
    color: "from-teal-500 to-teal-600",
  },
  {
    icon: Import,
    title: "Import Express",
    description: "Import and customs clearance services",
    color: "from-amber-500 to-amber-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Features() {
  return (
    <section id="services" className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            Our Services
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Comprehensive shipping solutions tailored for every type of shipment
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="h-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200">
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom Accent Line */}
                <div className={`h-1 w-0 bg-gradient-to-r ${feature.color} mt-4 group-hover:w-full transition-all duration-300 rounded-full`} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

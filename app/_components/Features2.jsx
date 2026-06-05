"use client";

import { motion } from "framer-motion";

const features = [
  {
    icon: "🎯",
    title: "Smart Logistics",
    description: "Technology-driven solutions built for efficiency",
  },
  {
    icon: "⚡",
    title: "Faster Deliveries",
    description: "Same-day and express options available",
  },
  {
    icon: "📦",
    title: "Full Transparency",
    description: "Real-time tracking for peace of mind",
  },
  {
    icon: "👥",
    title: "Customer Support",
    description: "24/7 support team ready to help",
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
    transition: { duration: 0.6 },
  },
};

export default function Features2() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 space-y-3"
          initial={{ opacity: 0, y: -15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            Why We're Different
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Cutting-edge technology meets personalized service
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all bg-white group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

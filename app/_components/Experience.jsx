"use client";

import { motion } from "framer-motion";

const stats = [
  { number: "15+", label: "Years Experience" },
  { number: "220+", label: "Countries Served" },
  { number: "10M+", label: "Packages Delivered" },
  { number: "99.2%", label: "Customer Satisfaction" },
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

export default function Experience() {
  return (
    <section className="py-20 bg-white" id="our-experience">
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
            Our Track Record
          </h2>
          <p className="text-purple-600 max-w-2xl mx-auto">
            Trusted by thousands of businesses worldwide
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center group"
            >
              <div className="relative inline-block">
                <div className="text-4xl md:text-5xl font-black text-purple-900 group-hover:text-purple-700 transition-colors">
                  {stat.number}
                </div>
                <div className="h-1 w-0 bg-purple-900 group-hover:w-12 transition-all duration-300 mx-auto mt-2 rounded-full" />
              </div>
              <div className="text-sm text-purple-600 mt-4 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

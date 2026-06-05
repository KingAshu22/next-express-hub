"use client";

import { motion } from "framer-motion";
import { Zap, TrendingUp, Truck, Heart } from "lucide-react";

const services = [
  {
    icon: Zap,
    title: "Smart Logistics",
    description: "Advanced tracking and real-time updates for complete visibility of your shipments",
  },
  {
    icon: TrendingUp,
    title: "Cost Savings",
    description: "Reduced costs and simplified operations to help your business grow",
  },
  {
    icon: Truck,
    title: "Same-Day Delivery",
    description: "Efficient warehouse management enabling quick deliveries",
  },
  {
    icon: Heart,
    title: "Customer Focus",
    description: "Reliable service with personalized support for every shipment",
  },
];

export default function Services() {
  return (
    <section className="py-20 bg-white">
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
            Why Choose Kargo One?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Industry-leading solutions tailored for your shipping needs
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative h-full p-8 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {service.description}
                </p>

                {/* Accent line */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-slate-900 rounded-br-2xl group-hover:w-full transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

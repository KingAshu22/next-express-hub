"use client";

import { motion } from "framer-motion";
import { ArrowRight, Package, Truck, CheckCircle as Check, MapPin, Zap } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "Book Online",
    description: "Book your shipment online or via customer service",
  },
  {
    icon: Truck,
    title: "Pickup",
    description: "We pick up your package from your location",
  },
  {
    icon: Zap,
    title: "Processing",
    description: "Package processed at our sorting facility",
  },
  {
    icon: MapPin,
    title: "International Shipping",
    description: "Shipping via our global network",
  },
  {
    icon: Check,
    title: "Delivery",
    description: "Last-mile delivery to recipient",
  },
];

export default function HowWeDoIt() {
  return (
    <section className="py-20 bg-white" id="how-we-do-it">
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
            How We Do It
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Simple, transparent, and efficient shipping process from start to finish
          </p>
        </motion.div>

        {/* Timeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Card */}
              <div className="h-full bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg group relative overflow-hidden">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-red-600 transform group-hover:scale-x-100 scale-x-0 origin-left transition-transform duration-300" />

                {/* Step Number */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-red-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="w-6 h-6 text-blue-600" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden lg:flex absolute -right-3 top-1/2 transform -translate-y-1/2 items-center justify-center"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ArrowRight className="w-5 h-5 text-blue-600 z-10 bg-white px-1 rounded" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-lg text-slate-600 mb-6">
            Ready to start shipping?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-red-600 text-white hover:from-blue-700 hover:to-red-700 transition-all"
          >
            Get Started Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

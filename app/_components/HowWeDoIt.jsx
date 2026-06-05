"use client";

import { motion } from "framer-motion";
import { ArrowRight, Package, Truck, CheckCircle2, MapPin, Zap } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "Book Online",
    description: "Quick and easy booking process",
  },
  {
    icon: Truck,
    title: "Pickup",
    description: "We pick up from your location",
  },
  {
    icon: Zap,
    title: "Processing",
    description: "Swift sorting and processing",
  },
  {
    icon: MapPin,
    title: "In Transit",
    description: "Real-time tracking available",
  },
  {
    icon: CheckCircle2,
    title: "Delivery",
    description: "Delivered to recipient",
  },
];

export default function HowWeDoIt() {
  return (
    <section className="py-20 bg-purple-50" id="how-we-do-it">
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
            How It Works
          </h2>
          <p className="text-purple-600 max-w-2xl mx-auto">
            Five simple steps to ship globally
          </p>
        </motion.div>

        {/* Timeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <div className="h-full bg-white rounded-xl p-6 border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all group">
                {/* Step Number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-purple-900 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-900 group-hover:text-white transition-all">
                  <step.icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <h3 className="text-sm font-semibold text-purple-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-purple-600">
                  {step.description}
                </p>
              </div>

              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden lg:flex absolute -right-2 top-1/2 transform -translate-y-1/2 items-center justify-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ArrowRight className="w-5 h-5 text-purple-400" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

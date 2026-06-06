"use client";

import { motion } from "framer-motion";
import { MessageCircle, FileText, Users, Package, File, Truck, MapPin, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MessageCircle,
    number: "1",
    title: "Connect with Consultant",
    description: "Understand the restricted and allowed items",
  },
  {
    icon: FileText,
    number: "2",
    title: "Get your quote",
    description: "Discover your personalized quote covering over 100 countries worldwide.",
  },
  {
    icon: Users,
    number: "3",
    title: "Schedule your pickup",
    description: "Our team member will come and pick your items from your door step",
  },
  {
    icon: Package,
    number: "4",
    title: "Pack your consignment",
    description: "We pack with export quality material as per international standard",
  },
  {
    icon: File,
    number: "5",
    title: "Prepare your export documents",
    description: "We will prepare all necessary documents",
  },
  {
    icon: Truck,
    number: "6",
    title: "Dispatch",
    description: "Smooth and stress free shipping through best international carriers",
  },
  {
    icon: MapPin,
    number: "7",
    title: "Track your consignment",
    description: "Get real-time tracking updates for your shipment",
  },
  {
    icon: CheckCircle,
    number: "8",
    title: "Delivered",
    description: "Get your shipment delivered to your designated address.",
  },
];

export default function HowWeDoIt() {
  return (
    <section className="py-20 bg-white" id="how-we-do-it">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20 space-y-3"
          initial={{ opacity: 0, y: -15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            8 simple steps to ship globally
          </p>
        </motion.div>

        {/* 8-Step Grid Layout */}
        <div className="space-y-16">
          {/* Row 1: Steps 1-4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.slice(0, 4).map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                {/* Icon Circle */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full border-2 border-blue-900 flex items-center justify-center bg-white hover:bg-blue-50 transition-all">
                    <step.icon className="w-10 h-10 text-blue-900" />
                  </div>
                  
                  {/* Step Number & Title */}
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {step.number}. {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Orange Arrow - only on steps 1, 2, 3 in first row */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute -right-8 top-12 text-orange-500 text-2xl">
                      <svg className="w-8 h-2 stroke-current" viewBox="0 0 24 6" fill="none">
                        <path d="M 0 3 Q 6 0, 12 3 T 24 3" strokeWidth="2" strokeDasharray="4,2" />
                        <path d="M 20 1 L 24 3 L 20 5" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Curved Arrow Down */}
          <div className="flex justify-center">
            <svg className="w-12 h-16 text-orange-500" viewBox="0 0 24 60" fill="none">
              <path d="M 12 0 Q 12 20, 12 40" stroke="currentColor" strokeWidth="2" strokeDasharray="4,2" />
              <path d="M 8 45 L 12 50 L 16 45" fill="currentColor" />
            </svg>
          </div>

          {/* Row 2: Steps 5-8 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.slice(4, 8).map((step, index) => (
              <motion.div
                key={index + 4}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: (index) * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                {/* Icon Circle */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full border-2 border-blue-900 flex items-center justify-center bg-white hover:bg-blue-50 transition-all">
                    <step.icon className="w-10 h-10 text-blue-900" />
                  </div>
                  
                  {/* Step Number & Title */}
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {step.number}. {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Orange Arrow - only on steps 5, 6, 7 in second row */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute -right-8 top-12 text-orange-500 text-2xl">
                      <svg className="w-8 h-2 stroke-current" viewBox="0 0 24 6" fill="none">
                        <path d="M 0 3 Q 6 0, 12 3 T 24 3" strokeWidth="2" strokeDasharray="4,2" />
                        <path d="M 20 1 L 24 3 L 20 5" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

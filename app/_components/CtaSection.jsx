"use client";

import { motion } from "framer-motion";
import { Package, ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full blur-3xl opacity-5"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-5"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400 mx-auto shadow-xl">
            <Package className="w-8 h-8 text-slate-900" />
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Ready to simplify your logistics?
          </h2>

          {/* Subheading */}
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Get a quote today and experience the Kargo One difference.
          </p>

          {/* CTA Button */}
          <motion.button
            onClick={() => window.location.href = "/contact"}
            className="inline-flex items-center gap-2 px-10 py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl group text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get a Free Quote
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

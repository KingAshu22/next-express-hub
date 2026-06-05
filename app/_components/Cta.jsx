"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CTA() {
  const router = useRouter();

  return (
    <section className="py-20 bg-purple-900 relative overflow-hidden">
      {/* Background gradient elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-purple-800 rounded-full blur-3xl opacity-40"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="text-center space-y-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Heading */}
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Ready to Ship Globally?
          </motion.h2>

          {/* Subheading */}
          <motion.p
            className="text-lg text-purple-300 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of businesses that trust Kargo One for fast, reliable, and affordable international shipping. Get started today.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Button
              onClick={() => router.push("/dashboard")}
              className="px-8 py-3 bg-white text-purple-900 hover:bg-purple-100 font-semibold rounded-lg transition-all"
            >
              Get Started Now
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/track")}
              className="px-8 py-3 text-white border-white hover:bg-white/10 font-semibold rounded-lg transition-all"
            >
              Track Shipment
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

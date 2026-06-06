"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CTA() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setMessage("");
      setIsSubmitting(false);
      router.push("/contact");
    }, 1000);
  };

  return (
    <section className="py-20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 relative overflow-hidden">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect x=\"10\" y=\"10\" width=\"20\" height=\"25\" fill=\"white\" stroke=\"white\" stroke-width=\"1\"/><rect x=\"40\" y=\"15\" width=\"25\" height=\"30\" fill=\"white\" stroke=\"white\" stroke-width=\"1\"/><rect x=\"70\" y=\"12\" width=\"18\" height=\"28\" fill=\"white\" stroke=\"white\" stroke-width=\"1\"/></svg>')",
          backgroundSize: "200px 200px",
        }}
      ></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Left Content */}
          <motion.div
            className="space-y-6 text-white"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold leading-tight">
              Your Shipping
              <span className="block text-orange-400">Starts Here</span>
            </h2>

            <p className="text-lg text-blue-100 leading-relaxed max-w-md">
              Experience a smooth and reliable shipping process with doorstep pickup, secure packing and trusted delivery to destinations worldwide.
            </p>

            <ul className="space-y-3">
              {[
                "24/7 Customer Support",
                "Real-time Tracking",
                "Insured Shipments",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-blue-50">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right Content - Contact Form */}
          <motion.div
            className="bg-white rounded-3xl p-8 shadow-2xl"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows="5"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {isSubmitting ? "Connecting..." : "Connect us"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

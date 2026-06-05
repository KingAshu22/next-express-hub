"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Mayank Kapoor",
    title: "Business Owner, Gurugram",
    text: "Kargo One's tracking is seamless and their door-to-door delivery is always reliable. The best part? Their support team is available whenever I need them!",
    rating: 5,
  },
  {
    name: "Yashika Khandelwal",
    title: "E-commerce Seller, Jaipur",
    text: "The pricing is truly transparent. I always know what I'm paying, and my shipments reach my customers on time, every time.",
    rating: 5,
  },
  {
    name: "Rohit Sharma",
    title: "Global Trader, Mumbai",
    text: "With Kargo One, I expanded my business overseas without any hassle. Their platform is easy to use and the rates are unbeatable.",
    rating: 5,
  },
  {
    name: "Priya Menon",
    title: "Frequent Shipper, Kochi",
    text: "Sending gifts to my family abroad is now stress-free. Kargo One makes sure my parcels are delivered safely and quickly.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-purple-50">
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
            Loved by Our Customers
          </h2>
          <p className="text-purple-600 max-w-2xl mx-auto">
            Join millions of satisfied customers worldwide
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 border border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-purple-700 mb-6 text-sm leading-relaxed italic">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div>
                <p className="font-semibold text-purple-900 text-sm">
                  {testimonial.name}
                </p>
                <p className="text-xs text-purple-600">
                  {testimonial.title}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-purple-200"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {[
            { label: "Happy Customers", value: "10M+" },
            { label: "Countries Served", value: "220+" },
            { label: "Packages Shipped", value: "100M+" },
            { label: "Success Rate", value: "99.2%" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-black text-purple-900 mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-purple-600">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

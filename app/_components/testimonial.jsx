"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Aneesh Augustine",
    location: "Ireland",
    text: "I received my Fleetgo courier in Cork, Ireland (16kg - 13 items from Tiruvalla, Kerala). All the items were carefully repacked by the Fleetgo staff to be spill-proof and arrived intact, in great shape and condition.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    name: "Tresa Mathew",
    location: "New Zealand",
    text: "This was my first experience with Fleetgo International Courier service and I am super happy with their service. My courier from Kerala to New Zealand reached in few days. Will be using Fleetgo International Courier in future for my couriers from Kerala 😊",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    name: "Rens Isac",
    location: "Kerala, India",
    text: "I had a very smooth experience with Fleet Go Courier Service. I recently sent Ayurvedic medicines from Kerala to Ireland, and everything reached on time and in perfect condition.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=3",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 space-y-3"
          initial={{ opacity: 0, y: -15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            What People Say
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            30,000 plus happy clients, 10+ Years of Experience, 100 plus countries served.
          </p>
        </motion.div>

        {/* Testimonials Grid - 3 columns */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
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
              className="bg-white rounded-2xl p-8 border border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all"
            >
              {/* Rating Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 mb-6 text-sm leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Customer Info */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

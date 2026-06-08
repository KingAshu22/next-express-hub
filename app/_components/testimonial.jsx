"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Aneesh Augustine",
    location: "Ireland",
    text: "I received my Kargo One courier in Cork, Ireland (16kg - 13 items from Tiruvalla, Kerala). All the items were carefully repacked by the Kargo One staff to be spill-proof and arrived intact, in great shape and condition.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    name: "Tresa Mathew",
    location: "New Zealand",
    text: "This was my first experience with Kargo One International Courier service and I am super happy with their service. My courier from Kerala to New Zealand reached in few days. Will be using Kargo One in future!",
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
  {
    name: "Sarah Johnson",
    location: "United Kingdom",
    text: "Outstanding service from start to finish! My fragile items were packed with great care and arrived in London without a single scratch. The tracking updates were incredibly helpful throughout the journey.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=9",
  },
  {
    name: "Michael Chen",
    location: "Singapore",
    text: "Kargo One made shipping my business documents from India to Singapore effortless. The customer support team was responsive and the delivery was faster than expected. Highly recommended!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Priya Sharma",
    location: "Canada",
    text: "I've been using Kargo One for over 2 years to send packages to my family in Toronto. Their pricing is competitive, service is reliable, and the team is always professional. Truly the best courier service!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=10",
  },
  {
    name: "David Williams",
    location: "Australia",
    text: "Sent a large shipment of personal belongings to Sydney. Everything arrived safely and the customs clearance was handled smoothly by their team. Saved me a lot of hassle. Excellent work!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=13",
  },
  {
    name: "Fatima Al-Hassan",
    location: "UAE",
    text: "Kargo One has been my go-to courier service for shipping to Dubai. The packaging quality is top-notch and delivery time is always as promised. Very transparent with pricing too!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=20",
  },
  {
    name: "James Anderson",
    location: "USA",
    text: "Shipped Indian sweets and clothes to New York for Diwali. The team was super helpful with packing recommendations and everything arrived fresh and intact. Will definitely use again!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=15",
  },
  {
    name: "Anita Krishnan",
    location: "Germany",
    text: "Excellent international courier service! I sent important legal documents from Kerala to Berlin and they were delivered within 4 days. The real-time tracking gave me peace of mind throughout.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?img=16",
  },
];

// Split testimonials into two rows
const row1 = testimonials.slice(0, 5);
const row2 = testimonials.slice(5, 10);

const TestimonialCard = ({ testimonial }) => (
  <div className="flex-shrink-0 w-[350px] md:w-[420px] mx-4">
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 h-full relative">
      {/* Quote Icon */}
      <Quote className="absolute top-6 right-6 w-8 h-8 text-blue-100" />

      {/* Rating Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Testimonial Text */}
      <p className="text-gray-700 mb-6 text-sm leading-relaxed line-clamp-4">
        "{testimonial.text}"
      </p>

      {/* Customer Info */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
        />
        <div>
          <p className="font-semibold text-gray-900">{testimonial.name}</p>
          <p className="text-xs text-gray-600">{testimonial.location}</p>
        </div>
      </div>
    </div>
  </div>
);

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6 mb-12">
        {/* Section Header */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: -15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            TESTIMONIALS
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            What People Say
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            30,000+ happy clients, 10+ Years of Experience, 100+ countries served.
          </p>
        </motion.div>
      </div>

      {/* Sliding Rows Container */}
      <div className="relative">
        {/* Gradient Overlays for fade effect on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Row 1 - Scrolls Left */}
        <div className="flex overflow-hidden group mb-6">
          <div className="flex animate-scroll-left group-hover:[animation-play-state:paused]">
            {[...row1, ...row1].map((testimonial, index) => (
              <TestimonialCard key={`row1-${index}`} testimonial={testimonial} />
            ))}
          </div>
        </div>

        {/* Row 2 - Scrolls Right */}
        <div className="flex overflow-hidden group">
          <div className="flex animate-scroll-right group-hover:[animation-play-state:paused]">
            {[...row2, ...row2].map((testimonial, index) => (
              <TestimonialCard key={`row2-${index}`} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 40s linear infinite;
          width: max-content;
        }

        .animate-scroll-right {
          animation: scroll-right 40s linear infinite;
          width: max-content;
        }
      `}</style>
    </section>
  );
}
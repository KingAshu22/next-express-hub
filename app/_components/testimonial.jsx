import { motion } from "framer-motion";
import Image from "next/image";

const testimonials = [
  {
    name: "Mayank Kapoor",
    title: "Aariv Impex Owner, Gurugram",
    avatar: "/testimonials/user1.jpg",
    text: "Express Hub's tracking is seamless and their door-to-door delivery is always reliable. The best part? Their support team is available whenever I need them!”",
    link: "#",
  },
  {
    name: "Yashika Khandelwal",
    title: "Auza Jewels Owner, Jaipur",
    avatar: "/testimonials/user2.jpg",
    text: "“The pricing Express Hub offers is truly transparent. I always know what I’m paying, and my shipments reach my customers on time, every time.”",
    link: "#",
  },
  {
    name: "Rohit Sharma",
    title: "Global Seller, Mumbai",
    avatar: "/testimonials/user3.jpg",
    text: "“With Express Hub, I expanded my business overseas without any hassle. Their platform is easy to use and the rates are unbeatable.”",
    link: "#",
  },
  {
    name: "Priya Menon",
    title: "Mother & Frequent Shipper, Kochi",
    avatar: "/testimonials/user4.jpg",
    text: "“Sending gifts to my family abroad is now stress-free. Express Hub makes sure my parcels are delivered safely and quickly.”",
    link: "#",
  },
];

export default function Testimonial() {
  const scrollingTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-16 flex justify-center bg-white">
      <div className="w-full max-w-6xl px-4 flex flex-col md:flex-row gap-8 items-start">
        {/* Left: Heading */}
        <div className="w-full md:w-1/2 mb-8 md:mb-0">
          <h3 className="text-2xl font-bold text-[#2563eb] mb-1">Customer Testimonials</h3>
          <div className="w-32 h-2 bg-yellow-400 rounded mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-[#232C65] mb-4">
            1 Crore+ Successful Shipments
          </h2>
          <p className="text-gray-700 max-w-lg">
            From parents sending love overseas to new entrepreneurs growing their brands, Express Hub is trusted by all. Discover why so many choose us for their shipping needs.
          </p>
        </div>

        {/* Right: Scrolling Testimonials */}
        <div className="w-full md:w-1/2 h-[400px] overflow-hidden relative">
          <motion.div
            className="flex flex-col gap-6"
            animate={{ y: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              duration: 16,
              ease: "linear",
            }}
            style={{ willChange: "transform" }}
          >
            {scrollingTestimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white border border-blue-100 rounded-2xl shadow-sm p-5 flex gap-4 items-start min-h-[120px]"
                style={{ minWidth: 0 }}
              >
                <div>
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={56}
                    height={56}
                    className="rounded-full border-4 border-yellow-400"
                  />
                </div>
                <div>
                  <div className="font-bold text-lg text-[#232C65]">{t.name}</div>
                  <div className="text-sm text-blue-600 font-medium mb-1">
                    <a href={t.link} target="_blank" rel="noopener noreferrer">{t.title}</a>
                  </div>
                  <div className="text-gray-700 text-base">{t.text}</div>
                </div>
              </div>
            ))}
          </motion.div>
          {/* Gradient fade top & bottom */}
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How do I schedule a pickup with Kargo Onee?",
    a: "Simply sign up, fill in your shipment details, and choose your preferred pickup date. Our team will handle the rest and collect your parcel from your doorstep.",
  },
  {
    q: "Are there any hidden charges in your shipping rates?",
    a: "No, our pricing is 100% transparent. You’ll see the exact cost before you confirm your shipment—no surprises or extra fees.",
  },
  {
    q: "Can I track my shipment in real time?",
    a: "Yes! Every shipment comes with real-time tracking so you and your customers can follow the journey from pickup to delivery.",
  },
  {
    q: "Do you support international shipping for small businesses?",
    a: "Absolutely. Whether you’re shipping one parcel or hundreds, Kargo Onee is designed to help businesses of all sizes go global with ease.",
  },
  {
    q: "What if I need help with customs or documentation?",
    a: "Our export experts are here to guide you through every step, from paperwork to customs clearance, ensuring a smooth shipping experience.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-16 bg-[#f4f8ff] flex justify-center">
      <div className="w-full max-w-3xl px-4">
        <h3 className="text-2xl font-bold text-[#2563eb] mb-1">FAQs</h3>
        <div className="w-32 h-2 bg-yellow-400 rounded mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold text-[#232C65] mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <div
                className={`flex items-center justify-between bg-white rounded-xl shadow-md px-5 py-4 cursor-pointer border-2 transition ${
                  open === idx
                    ? "border-yellow-400"
                    : "border-transparent hover:border-blue-200"
                }`}
                onClick={() => setOpen(open === idx ? null : idx)}
              >
                <span className="font-semibold text-[#232C65] text-base sm:text-lg">
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: open === idx ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-6 h-6 text-[#2563eb]" />
                </motion.span>
              </div>
              <AnimatePresence>
                {open === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="overflow-hidden bg-blue-50 rounded-b-xl px-5 pb-4"
                  >
                    <div className="text-gray-700 text-base pt-2">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
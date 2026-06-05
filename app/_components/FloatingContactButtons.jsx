"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import Image from "next/image";
import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";

export default function FloatingContactButtons() {
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { primary: 'bg-purple-900' };

  return (
    <>
      {/* Call Button - Bottom Left */}
      <motion.a
        href="tel:+919152039557"
        className="fixed bottom-8 left-8 z-40 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        aria-label="Call us"
      >
        <div className="relative">
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ opacity: 0.3 }}
          />

          {/* Button */}
          <div className={`relative w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer`}>
            <Phone className="w-6 h-6 text-white" strokeWidth={2} />
          </div>

          {/* Tooltip */}
          <motion.div
            className={`absolute left-16 top-1/2 -translate-y-1/2 ${colors.primary} text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`}
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
          >
            Call Us
          </motion.div>
        </div>
      </motion.a>

      {/* WhatsApp Button - Bottom Right */}
      <motion.a
        href="https://wa.me/919152039557"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-40 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        aria-label="Chat on WhatsApp"
      >
        <div className="relative">
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ opacity: 0.3 }}
          />

          {/* Button */}
          <div className={`relative w-14 h-14 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer`}>
            <Image
              src="/whatsapp.svg"
              alt="WhatsApp"
              width={24}
              height={24}
              className="w-6 h-6 text-white"
            />
          </div>

          {/* Tooltip */}
          <motion.div
            className={`absolute right-16 top-1/2 -translate-y-1/2 ${colors.primary} text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`}
            initial={{ opacity: 0, x: 10 }}
            whileHover={{ opacity: 1, x: 0 }}
          >
            Message Us
          </motion.div>
        </div>
      </motion.a>
    </>
  );
}

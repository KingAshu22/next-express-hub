"use client";

import { motion } from "framer-motion";

const RATES_DATA = [
  { name: "United States", flag: "🇺🇸", rate: "₹650" },
  { name: "United Kingdom", flag: "🇬🇧", rate: "₹620" },
  { name: "Canada", flag: "🇨🇦", rate: "₹680" },
  { name: "Australia", flag: "🇦🇺", rate: "₹720" },
  { name: "UAE", flag: "🇦🇪", rate: "₹580" },
  { name: "Singapore", flag: "🇸🇬", rate: "₹640" },
  { name: "Germany", flag: "🇩🇪", rate: "₹630" },
  { name: "France", flag: "🇫🇷", rate: "₹630" },
  { name: "Japan", flag: "🇯🇵", rate: "₹700" },
  { name: "China", flag: "🇨🇳", rate: "₹660" },
  { name: "Saudi Arabia", flag: "🇸🇦", rate: "₹590" },
  { name: "Netherlands", flag: "🇳🇱", rate: "₹640" },
];

export default function MarqueeRates() {
  // Duplicate the array for seamless loop
  const duplicatedRates = [...RATES_DATA, ...RATES_DATA];

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-8 overflow-hidden">
      <div className="relative flex items-center justify-start">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: [0, -50 * RATES_DATA.length * 80] }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {duplicatedRates.map((rate, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-8 py-4 rounded-lg bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 hover:border-slate-400/50 transition-all flex-shrink-0 min-w-fit group"
            >
              <span className="text-2xl">{rate.flag}</span>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Ship to {rate.name}
                </p>
                <p className="text-lg font-bold text-blue-400">
                  {rate.rate}/kg
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

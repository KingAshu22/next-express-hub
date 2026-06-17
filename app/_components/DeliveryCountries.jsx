"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Globe2, ArrowRight, MapPin, Plus } from "lucide-react";

const countries = [
  { name: "United Kingdom", code: "gb" },
  { name: "Germany", code: "de" },
  { name: "Ireland", code: "ie" },
  { name: "Switzerland", code: "ch" },
  { name: "Italy", code: "it" },
  { name: "Sweden", code: "se" },
  { name: "Malta", code: "mt" },
  { name: "Georgia", code: "ge" },
  { name: "USA", code: "us" },
  { name: "Canada", code: "ca" },
  { name: "New Zealand", code: "nz" },
  { name: "UAE", code: "ae" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Qatar", code: "qa" },
  { name: "Oman", code: "om" },
];

export default function DeliveryCountries() {
  const router = useRouter();

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <section className="relative py-20 md:py-24 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 overflow-hidden">
      {/* Dotted World Map Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Soft Glows */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Globe2 className="w-4 h-4" />
            Global Network
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            See Where{" "}
            <span className="text-yellow-400">Kargo One</span> Can Deliver to You
          </h2>
          <p className="text-blue-100 mt-4 text-base md:text-lg">
            From Europe to the Middle East, North America to Oceania — we've got your shipping covered worldwide.
          </p>
        </motion.div>

        {/* Country Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4 mb-12"
        >
          {countries.map((country, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -5, scale: 1.05 }}
              className="group cursor-pointer"
            >
              <div className="relative bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-yellow-400/50 rounded-2xl p-4 transition-all duration-300 overflow-hidden">
                {/* Flag */}
                <div className="relative w-full aspect-[4/3] mb-3 rounded-lg overflow-hidden shadow-lg ring-1 ring-white/20 group-hover:ring-yellow-400/50 transition-all">
                  <img
                    src={`https://flagcdn.com/w320/${country.code}.png`}
                    srcSet={`https://flagcdn.com/w640/${country.code}.png 2x`}
                    alt={`${country.name} flag`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Country Name */}
                <p className="text-white text-xs md:text-sm font-semibold text-center group-hover:text-yellow-400 transition-colors">
                  {country.name}
                </p>

                {/* Hover Pin Icon */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MapPin className="w-4 h-4 text-yellow-400" />
                </div>
              </div>
            </motion.div>
          ))}

          {/* "100+ More Countries" Card */}
          <motion.div
            variants={item}
            whileHover={{ y: -5, scale: 1.05 }}
            className="group cursor-pointer"
          >
            <div className="relative h-full bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 rounded-2xl p-4 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center min-h-[140px] shadow-xl">
              <div className="w-12 h-12 rounded-full bg-slate-900/10 flex items-center justify-center mb-2 group-hover:rotate-90 transition-transform duration-500">
                <Plus className="w-6 h-6 text-slate-900" strokeWidth={3} />
              </div>
              <p className="text-slate-900 text-sm font-bold text-center leading-tight">
                100+
                <br />
                <span className="text-xs">More Countries</span>
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button
            onClick={() => router.push("/contact")}
            className="inline-flex items-center gap-3 px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all shadow-2xl hover:shadow-yellow-400/30 hover:scale-105 group text-base md:text-lg"
          >
            Book Your Consignment
            <span className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-yellow-400" />
            </span>
          </button>

          {/* Stats */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mt-10 pt-8 border-t border-white/10 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-yellow-400">220+</p>
              <p className="text-xs md:text-sm text-blue-100 mt-1">Countries</p>
            </div>
            <div className="h-10 w-px bg-white/20 hidden md:block" />
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-yellow-400">10M+</p>
              <p className="text-xs md:text-sm text-blue-100 mt-1">Shipments</p>
            </div>
            <div className="h-10 w-px bg-white/20 hidden md:block" />
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-yellow-400">99.9%</p>
              <p className="text-xs md:text-sm text-blue-100 mt-1">On-Time</p>
            </div>
            <div className="h-10 w-px bg-white/20 hidden md:block" />
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-yellow-400">24/7</p>
              <p className="text-xs md:text-sm text-blue-100 mt-1">Support</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
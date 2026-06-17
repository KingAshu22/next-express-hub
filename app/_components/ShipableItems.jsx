"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Pill,
  Droplet,
  Lamp,
  Cookie,
  FileText,
  TreePine,
  ChefHat,
  Sparkles,
  Sofa,
  Soup,
  Smartphone,
  Gift,
  Package,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const shippableItems = [
  {
    icon: Pill,
    title: "Medicines",
    desc: "Prescription & OTC",
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    text: "text-rose-600",
  },
  {
    icon: Droplet,
    title: "Liquids & Oils",
    desc: "Sealed & leak-proof",
    gradient: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-50",
    text: "text-cyan-600",
  },
  {
    icon: Lamp,
    title: "Home Decor Items",
    desc: "Carefully packed",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  {
    icon: Cookie,
    title: "Packed / Sealed Foods",
    desc: "Factory-sealed only",
    gradient: "from-orange-500 to-red-600",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  {
    icon: FileText,
    title: "Documents & Parcels",
    desc: "Express delivery",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    icon: TreePine,
    title: "Wooden Items",
    desc: "Customs cleared",
    gradient: "from-yellow-700 to-amber-800",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  {
    icon: ChefHat,
    title: "Homemade Food Items",
    desc: "Vacuum-sealed packing",
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    icon: Sparkles,
    title: "Cosmetics & Skincare",
    desc: "Safe & compliant",
    gradient: "from-pink-500 to-fuchsia-600",
    bg: "bg-pink-50",
    text: "text-pink-600",
  },
  {
    icon: Sofa,
    title: "Furniture",
    desc: "Bulky cargo shipping",
    gradient: "from-stone-600 to-slate-700",
    bg: "bg-stone-50",
    text: "text-stone-700",
  },
  {
    icon: Soup,
    title: "Pickles & Masalas",
    desc: "Authentic Indian flavors",
    gradient: "from-red-500 to-orange-600",
    bg: "bg-red-50",
    text: "text-red-600",
  },
  {
    icon: Smartphone,
    title: "Electronics & Gadgets",
    desc: "Insured shipping",
    gradient: "from-slate-600 to-slate-800",
    bg: "bg-slate-100",
    text: "text-slate-700",
  },
  {
    icon: Gift,
    title: "Clothes, Gifts & Accessories",
    desc: "Personal items",
    gradient: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
];

export default function ShippableItems() {
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
    <section className="relative py-20 md:py-24 bg-gradient-to-b from-white via-blue-50/40 to-white overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Package className="w-4 h-4" />
            Shippable Items
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            What You Can Ship With{" "}
            <span className="text-blue-700">Kargo One</span>
          </h2>
          <p className="text-gray-600 mt-4 text-base md:text-lg">
            We ship most everyday items with secure packing, easy customs clearance, and trusted global delivery.
          </p>
        </motion.div>

        {/* Items Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5 mb-14"
        >
          {shippableItems.map((it, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -6 }}
              className="group cursor-pointer"
            >
              <div className="relative h-full bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Subtle gradient hover overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${it.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                {/* Icon */}
                <div className="relative flex justify-center mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl ${it.bg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${it.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <it.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-sm md:text-base font-bold text-slate-900 text-center mb-1 leading-tight group-hover:text-blue-700 transition-colors">
                  {it.title}
                </h4>

                {/* Description */}
                <p
                  className={`text-xs ${it.text} text-center font-medium opacity-70 group-hover:opacity-100 transition-opacity`}
                >
                  {it.desc}
                </p>

                {/* Bottom accent line */}
                <div
                  className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${it.gradient} group-hover:w-full transition-all duration-500`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-6 md:p-8 overflow-hidden shadow-2xl">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400 rounded-full opacity-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400 rounded-full opacity-10" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4 text-center md:text-left">
                <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center flex-shrink-0 shadow-xl hidden md:flex">
                  <ShieldCheck className="w-7 h-7 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                    Not sure if your item is shippable?
                  </h3>
                  <p className="text-blue-100 text-sm md:text-base">
                    Our experts will guide you with packaging, customs & compliance.
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push("/contact")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 group whitespace-nowrap"
              >
                Talk to an Expert
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
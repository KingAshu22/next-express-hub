"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Zap,
  Wallet,
  Pill,
  GraduationCap,
  Home,
  ShoppingCart,
  Landmark,
  Palette,
  Package,
  Building2,
  ArrowRight,
  Truck,
} from "lucide-react";

/* ---------- ALL EXPORT SERVICES (Unified) ---------- */
const exportServices = [
  {
    type: "icon",
    icon: Zap,
    title: "Self Express Courier",
    desc: "Fastest delivery option for urgent parcels. Ideal for documents, gifts, electronics, and time-critical items.",
    color: "from-blue-500 to-blue-700",
    textColor: "text-blue-700",
  },
  {
    type: "icon",
    icon: Wallet,
    title: "Self Economy Courier",
    desc: "Affordable and reliable economy courier service for non-urgent international shipments.",
    color: "from-emerald-500 to-emerald-700",
    textColor: "text-emerald-700",
  },
  {
    type: "logo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg",
    title: "DHL Express Service",
    desc: "Premium global express courier service for fast and secure international deliveries worldwide.",
    bgGradient: "from-yellow-50 to-amber-100",
    accentColor: "bg-red-600",
    textColor: "text-red-600",
  },
  {
    type: "logo",
    logo: "https://cdn.worldvectorlogo.com/logos/fedex-express-6.svg",
    title: "FedEx International Service",
    desc: "Worldwide express and economy options for parcels and important documents.",
    bgGradient: "from-purple-50 to-orange-50",
    accentColor: "bg-purple-700",
    textColor: "text-purple-700",
  },
  {
    type: "logo",
    logo: "https://cdn.worldvectorlogo.com/logos/ups-logo-1.svg",
    title: "UPS Worldwide Service",
    desc: "Reliable and secure courier service for global shipments and business deliveries.",
    bgGradient: "from-amber-50 to-yellow-100",
    accentColor: "bg-amber-900",
    textColor: "text-amber-900",
  },
  {
    type: "logo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Aramex_logo.svg",
    title: "Aramex International Service",
    desc: "Cost-effective delivery to GCC, Middle East, and major worldwide destinations.",
    bgGradient: "from-red-50 to-rose-100",
    accentColor: "bg-red-600",
    textColor: "text-red-600",
  },
  {
    type: "icon",
    icon: Pill,
    title: "Medicine Courier",
    desc: "Specialized shipping for prescription medicines and medical items with full compliance.",
    color: "from-rose-500 to-rose-700",
    textColor: "text-rose-700",
  },
  {
    type: "icon",
    icon: GraduationCap,
    title: "Student Express Courier",
    desc: "Special discounted shipping rates and care packages for students studying abroad.",
    color: "from-indigo-500 to-indigo-700",
    textColor: "text-indigo-700",
  },
  {
    type: "icon",
    icon: Home,
    title: "Relocation Express Courier",
    desc: "Complete relocation and household goods shipping with end-to-end care.",
    color: "from-teal-500 to-teal-700",
    textColor: "text-teal-700",
  },
  {
    type: "icon",
    icon: ShoppingCart,
    title: "International E-commerce",
    desc: "End-to-end logistics solutions for global online sellers and marketplaces.",
    color: "from-pink-500 to-pink-700",
    textColor: "text-pink-700",
  },
  {
    type: "icon",
    icon: Landmark,
    title: "Cargo Shipments",
    desc: "Specialized handling for large cargo, temple goods, and bulk consignments.",
    color: "from-amber-500 to-amber-700",
    textColor: "text-amber-700",
  },
  {
    type: "icon",
    icon: Palette,
    title: "Artifacts & Handicraft Courier",
    desc: "Safe, insured shipping for fragile artifacts, handicrafts, and cultural items.",
    color: "from-fuchsia-500 to-fuchsia-700",
    textColor: "text-fuchsia-700",
  },
];

/* ---------- IMPORT SERVICES ---------- */
const importServices = [
  {
    icon: Package,
    title: "Personal Goods (C-C)",
    desc: "Hassle-free import of personal items from anywhere in the world. Complete customs clearance support included.",
  },
  {
    icon: Building2,
    title: "Business Import (B-B)",
    desc: "Reliable B2B import solutions for businesses with end-to-end documentation and clearance.",
  },
];

export default function Services() {
  const router = useRouter();

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section
      id="services"
      className="relative py-20 md:py-24 bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden"
    >
      {/* Decorative blobs */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-yellow-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Banner Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14 max-w-3xl mx-auto"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
            What We Offer
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Our International{" "}
            <span className="text-blue-700">Courier Services</span>
          </h2>
          <p className="text-gray-600 mt-4 text-base md:text-lg">
            We support almost all personal and commercial items with trusted global partners.
          </p>
        </motion.div>

        {/* ============ EXPORT SERVICES ============ */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center shadow-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                Export Services
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
                Send Worldwide
              </h3>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent ml-4" />
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {exportServices.map((service, i) => (
              <motion.div key={i} variants={item} className="group">
                {service.type === "logo" ? (
                  /* ============ BRAND LOGO CARD ============ */
                  <div
                    className={`relative h-full bg-gradient-to-br ${service.bgGradient} rounded-2xl p-6 border-2 border-transparent hover:border-gray-300 hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col`}
                  >
                    {/* Logo Container */}
                    <div className="h-20 flex items-center justify-center mb-4 bg-white/70 rounded-xl backdrop-blur-sm p-3 group-hover:scale-105 transition-transform duration-300">
                      <div className="relative w-full h-full">
                        <Image
                          src={service.logo}
                          alt={service.title}
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                    </div>

                    <h4 className="text-base md:text-lg font-bold text-slate-900 mb-2">
                      {service.title}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed mb-4 flex-1">
                      {service.desc}
                    </p>

                    <button
                      onClick={() => router.push("/services")}
                      className={`inline-flex items-center gap-1.5 ${service.textColor} font-semibold text-sm hover:gap-2.5 transition-all`}
                    >
                      Ship Now
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Bottom accent line */}
                    <div
                      className={`absolute bottom-0 left-0 h-1 w-0 ${service.accentColor} group-hover:w-full transition-all duration-500`}
                    />
                  </div>
                ) : (
                  /* ============ ICON CARD ============ */
                  <div className="relative h-full bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                    {/* Gradient hover overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                    />

                    {/* Icon - height matches logo container for alignment */}
                    <div className="h-20 flex items-center mb-4">
                      <div
                        className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                      >
                        <service.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    <h4 className="text-base md:text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                      {service.title}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-4 flex-1">
                      {service.desc}
                    </p>

                    <button
                      onClick={() => router.push("/services")}
                      className={`inline-flex items-center gap-1.5 ${service.textColor} font-semibold text-sm hover:gap-2.5 transition-all`}
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Bottom accent */}
                    <div
                      className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${service.color} group-hover:w-full transition-all duration-500`}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ============ IMPORT SERVICES ============ */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider">
                Import Services
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
                Receive From Anywhere
              </h3>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-yellow-200 to-transparent ml-4" />
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {importServices.map((service, i) => (
              <motion.div key={i} variants={item} className="group">
                <div className="relative h-full bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-8 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="absolute -top-8 -right-8 w-40 h-40 bg-yellow-400 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" />
                  <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500 rounded-full opacity-10" />

                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform">
                      <service.icon className="w-8 h-8 text-slate-900" />
                    </div>

                    <h4 className="text-2xl font-bold text-white mb-3">
                      {service.title}
                    </h4>
                    <p className="text-blue-100 leading-relaxed mb-6">
                      {service.desc}
                    </p>

                    <button
                      onClick={() => router.push("/services")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold text-sm rounded-xl transition-all shadow-lg group/btn"
                    >
                      Explore Now
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
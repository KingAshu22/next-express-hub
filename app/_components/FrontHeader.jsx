"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Package, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FrontHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);

  const servicesMenu = {
    "Export Services": [
      "Self Express Courier",
      "Self Economy Courier",
      "FedEx | UPS | DHL | Aramex",
      "Medicine Express",
      "Express Baggage Services",
      "Student Express",
      "Relocation Express",
      "International E-commerce",
      "Cargo Shipments (Temples & Artefacts)",
    ],
    "Import Services": [
      "Personal Goods (C-C)",
      "Business Import (B-B)",
    ],
  };

  const solutionsMenu = [
    "Business Solutions",
    "E-commerce Solutions",
    "Bulk Shipping",
    "API Integration",
  ];

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "#services", dropdown: "services" },
    { label: "Import Services", href: "#import", },
    { label: "Solutions", href: "#solutions", dropdown: "solutions" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center hover:opacity-90 transition">
              <Image
                src="/kargoone-logo.png"
                alt="Kargo One"
                width={160}
                height={50}
                className="object-contain h-10 md:h-12 w-auto"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.label} className="relative group">
                  <button
                    onClick={() => !link.dropdown && router.push(link.href)}
                    className="px-4 py-2 text-slate-700 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors relative"
                  >
                    {link.label}
                    {link.dropdown && (
                      <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                    )}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-yellow-400 group-hover:w-6 transition-all" />
                  </button>

                  {/* Services Mega Menu */}
                  {link.dropdown === "services" && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-[600px]">
                      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 grid grid-cols-2 gap-6">
                        {Object.entries(servicesMenu).map(([category, items]) => (
                          <div key={category}>
                            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                              {category}
                            </h4>
                            <ul className="space-y-2">
                              {items.map((item, idx) => (
                                <li key={idx}>
                                  <button
                                    onClick={() => router.push("/services")}
                                    className="text-sm text-slate-600 hover:text-blue-700 transition-colors text-left w-full flex items-center gap-2 group/item"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-gray-300 group-hover/item:bg-yellow-400 transition-colors" />
                                    {item}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solutions Dropdown */}
                  {link.dropdown === "solutions" && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56">
                      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3">
                        {solutionsMenu.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => router.push("/solutions")}
                            className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => router.push("/track")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <Package className="w-4 h-4" />
                Track Shipment
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg group"
              >
                Login
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-slate-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden overflow-hidden border-t border-gray-100"
              >
                <div className="py-4 space-y-1">
                  {navLinks.map((link) => (
                    <div key={link.label}>
                      <button
                        onClick={() => {
                          if (link.dropdown === "services") {
                            setMobileServicesOpen(!mobileServicesOpen);
                          } else if (link.dropdown === "solutions") {
                            setMobileSolutionsOpen(!mobileSolutionsOpen);
                          } else {
                            router.push(link.href);
                            setMobileMenuOpen(false);
                          }
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium text-sm transition"
                      >
                        {link.label}
                        {link.dropdown && (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              (link.dropdown === "services" && mobileServicesOpen) ||
                              (link.dropdown === "solutions" && mobileSolutionsOpen)
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        )}
                      </button>

                      {/* Mobile Services Submenu */}
                      {link.dropdown === "services" && mobileServicesOpen && (
                        <div className="pl-4 py-2 space-y-3 bg-gray-50 rounded-lg mx-2 my-1">
                          {Object.entries(servicesMenu).map(([category, items]) => (
                            <div key={category}>
                              <p className="text-xs font-bold text-blue-700 uppercase px-3 py-1">
                                {category}
                              </p>
                              {items.map((item, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    router.push("/services");
                                    setMobileMenuOpen(false);
                                  }}
                                  className="block w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:text-blue-700"
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mobile Solutions Submenu */}
                      {link.dropdown === "solutions" && mobileSolutionsOpen && (
                        <div className="pl-4 py-2 bg-gray-50 rounded-lg mx-2 my-1">
                          {solutionsMenu.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                router.push("/solutions");
                                setMobileMenuOpen(false);
                              }}
                              className="block w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:text-blue-700"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="px-4 pt-4 space-y-2 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => {
                        router.push("/track");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl"
                    >
                      <Package className="w-4 h-4" />
                      Track Shipment
                    </button>
                    <button
                      onClick={() => {
                        router.push("/dashobard");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold text-sm rounded-xl"
                    >
                      Login
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
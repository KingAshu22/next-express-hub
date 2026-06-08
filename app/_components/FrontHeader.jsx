"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function FrontHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "#services", submenu: true },
    { label: "About Us", href: "/about" },
    { label: "Track Shipment", href: "/track" },
    { label: "Pricing", href: "#pricing" },
    { label: "Blog", href: "/blogs" },
    { label: "Contact Us", href: "/contact" },
  ];

  const services = [
    "Express Delivery",
    "Air Freight",
    "Sea Freight",
    "Warehousing",
    "Surface Transport",
    "Customs Clearance",
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl z-50 border-b border-slate-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight">kargo<span className="text-yellow-400">one</span></span>
              <span className="text-xs text-gray-300 font-medium">— EXPRESS NOW —</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <div key={link.href} className="relative group">
                <button
                  onClick={() => !link.submenu && router.push(link.href)}
                  className="text-gray-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 group"
                >
                  {link.label}
                  {link.submenu && <ChevronDown className="w-4 h-4" />}
                </button>
                {link.submenu && (
                  <div className="absolute left-0 mt-0 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                    {services.map((service, idx) => (
                      <button
                        key={idx}
                        onClick={() => router.push("#services")}
                        className="block w-full text-left px-4 py-2 text-gray-300 hover:text-yellow-400 hover:bg-slate-700 transition-colors text-sm"
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <a 
              href="tel:+918882940780"
              className="flex items-center gap-2 text-gray-200 hover:text-yellow-400 transition-colors font-medium"
            >
              <Phone className="w-4 h-4" />
              888-294-0780
            </a>
            <button
              onClick={() => router.push("/contact")}
              className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get a Quote
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-800 transition text-gray-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden border-t border-slate-800 py-4 space-y-2 pb-4"
          >
            {navLinks.map((link) => (
              <div key={link.href}>
                <button
                  onClick={() => {
                    if (!link.submenu) {
                      router.push(link.href);
                      setMobileMenuOpen(false);
                    } else {
                      setServicesOpen(!servicesOpen);
                    }
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-200 hover:text-yellow-400 hover:bg-slate-800 rounded-lg transition text-sm font-medium flex items-center justify-between"
                >
                  {link.label}
                  {link.submenu && <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />}
                </button>
                {link.submenu && servicesOpen && (
                  <div className="bg-slate-800/50 rounded-lg my-1 space-y-1 ml-4">
                    {services.map((service, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          router.push("#services");
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-1 text-gray-300 hover:text-yellow-400 transition-colors text-xs"
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-slate-700 pt-4 mt-4 px-4 space-y-3">
              <a 
                href="tel:+918882940780"
                className="flex items-center gap-2 text-gray-200 hover:text-yellow-400 transition-colors font-medium text-sm"
              >
                <Phone className="w-4 h-4" />
                888-294-0780
              </a>
              <button
                onClick={() => {
                  router.push("/contact");
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg transition-all"
              >
                Get a Quote
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function FrontHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Services", href: "#services" },
    { label: "How It Works", href: "#how-we-do-it" },
    { label: "Experience", href: "#our-experience" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl z-50 shadow-sm border-b border-purple-200/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition group">
            <Image
              src="/logo.jpg"
              alt="Kargo Logo"
              width={140}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-purple-700 font-medium hover:text-purple-900 transition-colors relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-900 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-sm text-purple-700 hover:bg-purple-100 hover:text-purple-900"
            >
              Login
            </Button>
            <Button
              onClick={() => router.push("/track")}
              className="text-sm bg-purple-900 hover:bg-purple-800 text-white rounded-lg px-6 py-2 transition-all"
            >
              Track
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-purple-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-purple-700" />
              ) : (
                <Menu className="w-5 h-5 text-purple-700" />
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
            className="lg:hidden border-t border-purple-200 py-4 space-y-3"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-purple-700 hover:bg-purple-50 rounded-lg transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 px-4 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  router.push("/dashboard");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center text-sm"
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  router.push("/track");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center bg-purple-900 hover:bg-purple-800 text-white text-sm"
              >
                Track Parcel
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}

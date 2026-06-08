"use client";

import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-3">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight">
                kargo<span className="text-yellow-400">one</span>
              </span>
              <span className="text-xs text-gray-300 font-medium tracking-wider">
                — EXPRESS NOW —
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your trusted logistics partner, delivering excellence across the
              globe. Fast, reliable and secure shipping solutions.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-yellow-400 hover:text-slate-900 text-gray-300 flex items-center justify-center transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-yellow-400 hover:text-slate-900 text-gray-300 flex items-center justify-center transition-all duration-300"
              >
                <Linkedin className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-yellow-400 hover:text-slate-900 text-gray-300 flex items-center justify-center transition-all duration-300"
              >
                <Twitter className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-yellow-400 hover:text-slate-900 text-gray-300 flex items-center justify-center transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Services Column */}
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
              Services
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#services"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Express Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Air Freight
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Sea Freight
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Warehousing
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Surface Transport
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/blogs"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Get In Touch Column */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
              Get In Touch
            </h3>
            <div className="space-y-4 text-sm">
              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  <a
                    href="tel:+919152039557"
                    className="text-gray-300 hover:text-yellow-400 transition-colors"
                  >
                    +91 91520 39557
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <a
                    href="mailto:support@kargoone.com"
                    className="text-gray-300 hover:text-yellow-400 transition-colors break-all"
                  >
                    support@kargoone.com
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Address</p>
                  <p className="text-gray-300 leading-relaxed">
                    Shop no 10, Ground floor Prakashwadi CHS, Beside Summit
                    Business park, Gundavali, Andheri East, Mumbai, Maharashtra
                    400093
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours Column */}
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
              Business Hours
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="space-y-2 flex-1">
                  <div>
                    <p className="text-gray-300 font-medium">Mon - Fri</p>
                    <p className="text-xs text-gray-400">
                      9:00 AM - 6:00 PM IST
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium">Saturday</p>
                    <p className="text-xs text-gray-400">
                      10:00 AM - 4:00 PM IST
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium">Sunday</p>
                    <p className="text-xs text-red-400">Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>&copy; {currentYear} Kargo One. All rights reserved. Designed & Developed by <a href="https://exprova.com" target="_blank" rel="noreferrer" className="text-red-400">Exprova.com</a></p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy-policy"
                className="hover:text-yellow-400 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms-of-service"
                className="hover:text-yellow-400 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="hover:text-yellow-400 transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
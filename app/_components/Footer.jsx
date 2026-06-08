"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const address = "Shop no 10, Ground floor Prakashwadi CHS Beside Summit Business park, Gundavali, Andheri East, Mumbai, Maharashtra 400093";
  const branches = ["Hyderabad", "Bangalore", "Kerala"];

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">kargo<span className="text-yellow-400">one</span></span>
              <span className="text-xs text-gray-300 font-medium">— EXPRESS NOW —</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Your trusted logistics partner, delivering excellence across the globe.
            </p>
          </div>

          {/* Services Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#services" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Express Delivery
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Air Freight
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Sea Freight
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Warehousing
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Surface Transport
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/track" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Track Shipment
                </Link>
              </li>
              <li>
                <a href="mailto:support@kargoone.com" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <Link href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <a href="mailto:info@kargoone.com" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">116 2nd Ave N, Hurley, WI 54534, USA</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <a href="tel:+918882940780" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  888-294-0780
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <a href="mailto:info@kargoone.com" className="text-gray-300 hover:text-yellow-400 transition-colors">
                  info@kargoone.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>
              &copy; {currentYear} Kargo One. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-yellow-400 transition-colors">
                <Facebook className="w-4 h-4" />
              </Link>
              <Link href="#" className="hover:text-yellow-400 transition-colors">
                <Linkedin className="w-4 h-4" />
              </Link>
              <Link href="#" className="hover:text-yellow-400 transition-colors">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="hover:text-yellow-400 transition-colors">
                <Instagram className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

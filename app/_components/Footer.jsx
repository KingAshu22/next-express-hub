"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";
import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const themeContext = useContext(ThemeContext);
  const colors = themeContext?.colors || { footer: 'bg-purple-900' };

  const address = "Shop no 10, Ground floor Prakashwadi CHS Beside Summit Business park, Gundavali, Andheri East, Mumbai, Maharashtra 400093";
  const branches = ["Hyderabad", "Bangalore", "Kerala"];

  return (
    <footer className={`${colors.footer} text-white`}>
      {/* Main Footer */}
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Image
              src="/logo.jpg"
              alt="Kargo Logo"
              width={140}
              height={40}
              className="h-10 w-auto"
            />
            <p className="text-sm text-white/80 leading-relaxed">
              Trusted international shipping solutions for businesses and individuals worldwide.
            </p>
          </div>

          {/* Services Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors">
                  International Shipping
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors">
                  Express Delivery
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors">
                  Cargo Services
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/70 hover:text-white transition-colors">
                  Track Shipment
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-white/70 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/70 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-white/70 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                <p className="text-white/70">+91 91520 39557</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                <p className="text-white/70">{address}</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                <p className="text-white/70">support@kargoone.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Branches Section */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">Our Branches</h3>
          <div className="flex flex-wrap gap-4">
            {branches.map((branch, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-white/70">{branch}</span>
                {index < branches.length - 1 && (
                  <span className="text-white/40">|</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/70">
            <p>
              &copy; {currentYear} Designed & Developed by Exprova.com
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-purple-900 text-purple-200">
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
            <p className="text-sm text-purple-300 leading-relaxed">
              Trusted international shipping solutions for businesses and individuals worldwide.
            </p>
          </div>

          {/* Services Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                  International Shipping
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                  Express Delivery
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                  Cargo Services
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-300 hover:text-white transition-colors">
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
                <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-purple-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-purple-300">+91 81691 55537</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-purple-300">Mumbai, Hyderabad,</p>
                  <p className="text-purple-300">Bangalore, Kerala</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0" />
                <p className="text-purple-300">support@kargoone.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-purple-800">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-purple-300">
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

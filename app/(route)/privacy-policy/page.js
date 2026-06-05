"use client";

import { motion } from "framer-motion";
import FrontHeader from "../../_components/FrontHeader";
import Footer from "../../_components/Footer";
import FloatingContactButtons from "../../_components/FloatingContactButtons";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, place an order, or contact us. This includes your name, email, phone number, shipping address, and payment information.",
    },
    {
      title: "2. How We Use Your Information",
      content: "We use the information we collect to process your shipments, improve our services, communicate with you about your orders, and comply with legal obligations.",
    },
    {
      title: "3. Data Security",
      content: "We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.",
    },
    {
      title: "4. Third-Party Sharing",
      content: "We may share your information with trusted partners who assist us in operating our website and conducting our business, subject to confidentiality agreements.",
    },
    {
      title: "5. Cookies and Tracking",
      content: "We use cookies and similar tracking technologies to enhance your browsing experience and understand how you interact with our website.",
    },
    {
      title: "6. Your Rights",
      content: "You have the right to access, modify, or delete your personal information. You can contact us to exercise these rights.",
    },
    {
      title: "7. Changes to This Policy",
      content: "We may update this privacy policy from time to time. We will notify you of any significant changes via email or by posting the updated policy on our website.",
    },
    {
      title: "8. Contact Us",
      content: "If you have questions about this privacy policy, please contact us at support@kargoone.com or +91 81691 55537.",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <FrontHeader />
      <FloatingContactButtons />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Learn how we protect and handle your personal information
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="prose prose-lg max-w-none"
          >
            <p className="text-gray-600 mb-8">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <p className="text-gray-700 mb-8">
              Kargo One ("we", "us", "our") operates the kargoone.com website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>

            <div className="space-y-8">
              {sections.map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  className="space-y-3"
                >
                  <h2 className="text-xl font-semibold text-gray-900">
                    {section.title}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

"use client";

import { motion } from "framer-motion";
import FrontHeader from "../../_components/FrontHeader";
import Footer from "../../_components/Footer";
import FloatingContactButtons from "../../_components/FloatingContactButtons";

export default function About() {

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
              About Kargo One
            </h1>
            <p className="text-lg text-gray-600">
              Your trusted partner in international shipping since 2010
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4 md:px-6 bg-purple-50">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Founded in 2010, Kargo One emerged from a simple vision: to make international shipping accessible, affordable, and reliable for businesses and individuals across India. Over more than a decade, we've grown to become one of India's most trusted international courier services.
              </p>
              <p>
                What started as a small operation in Mumbai has expanded to multiple cities including Hyderabad, Bangalore, and Kerala. Our commitment to excellence has earned us the trust of thousands of customers who depend on us to deliver their parcels safely across 220+ countries.
              </p>
              <p>
                Today, we've successfully shipped over 10 million parcels, maintaining a 99.2% customer satisfaction rate. Our success is built on three core pillars: reliability, affordability, and transparency.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
              <p className="text-gray-700">
                To provide fast, reliable, and affordable international shipping solutions that empower businesses to grow globally and help individuals connect with loved ones worldwide.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
              <p className="text-gray-700">
                To become the most trusted and customer-centric international shipping platform, setting new standards of excellence in the logistics industry.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 md:px-6 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 mb-12 text-center"
          >
            Our Core Values
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Reliability", desc: "We deliver on our promises, every time." },
              { title: "Transparency", desc: "Clear communication at every step of your shipment." },
              { title: "Innovation", desc: "Continuously improving our services and technology." },
              { title: "Customer Focus", desc: "Your satisfaction is our ultimate goal." },
              { title: "Integrity", desc: "Honest dealings with all stakeholders." },
              { title: "Sustainability", desc: "Committed to eco-friendly shipping practices." },
            ].map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

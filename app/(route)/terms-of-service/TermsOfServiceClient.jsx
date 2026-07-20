"use client";

import { motion } from "framer-motion";
import FrontHeader from "../../_components/FrontHeader";
import Footer from "../../_components/Footer";
import FloatingContactButtons from "../../_components/FloatingContactButtons";

export default function TermsOfService() {
  const sections = [
    {
      title: "1. Use License",
      content: "Permission is granted to temporarily download one copy of the materials (information or software) on Kargo One's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.",
    },
    {
      title: "2. Disclaimer",
      content: "The materials on Kargo One's website are provided on an 'as is' basis. Kargo One makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
    },
    {
      title: "3. Limitations",
      content: "In no event shall Kargo One or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Kargo One's website.",
    },
    {
      title: "4. Accuracy of Materials",
      content: "The materials appearing on Kargo One's website could include technical, typographical, or photographic errors. Kargo One does not warrant that any of the materials on its website are accurate, complete, or current.",
    },
    {
      title: "5. Links",
      content: "Kargo One has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Kargo One of the site. Use of any such linked website is at the user's own risk.",
    },
    {
      title: "6. Modifications",
      content: "Kargo One may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.",
    },
    {
      title: "7. Governing Law",
      content: "These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.",
    },
    {
      title: "8. Shipping Liability",
      content: "Kargo One will exercise due diligence in handling and delivering your shipments. However, we are not liable for lost, damaged, or delayed packages beyond the declared value, except where prohibited by law.",
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
              Terms of Service
            </h1>
            <p className="text-lg text-gray-600">
              Please read these terms carefully before using our services
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
              Welcome to Kargo One. These Terms of Service govern your use of our website and services. By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
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

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-12 p-6 bg-purple-50 rounded-lg border border-purple-200"
            >
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please contact us at support@kargoone.com or +91 91520 39557.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

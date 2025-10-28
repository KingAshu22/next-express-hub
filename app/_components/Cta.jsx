"use client"

import { useEffect, useRef, useState } from "react"

export default function CTA() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="contact" ref={ref} className="py-20 md:py-32 bg-gradient-to-r from-primary to-primary-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className={`space-y-8 transition-all duration-1000 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white">Ready to Transform Your Logistics?</h2>

          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Join thousands of businesses that trust Express Hub for their delivery needs. Let's streamline your operations
            today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button className="px-10 py-4 bg-accent hover:bg-accent-dark text-primary font-bold rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105">
              Get Started Now
            </button>
            <button className="px-10 py-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg border-2 border-white transition-all duration-300 hover:shadow-lg hover:scale-105">
              Schedule a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

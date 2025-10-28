"use client"

import { useEffect, useRef, useState } from "react"

export default function About() {
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
    <section id="about" ref={ref} className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Illustration */}
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
          >
            <div className="relative h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📱💻</div>
                  <p className="text-gray-600 font-semibold">FleetGo Dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div
            className={`space-y-6 transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">About Us</h2>

            <p className="text-lg text-gray-600 leading-relaxed">
              At FleetGo, logistics isn't just about moving goods—it's about delivering trust, efficiency, and
              innovation. With over a decade of expertise, we've transformed traditional logistics into a seamless,
              technology-driven experience.
            </p>

            <p className="text-lg text-gray-600 leading-relaxed">
              We prioritize transparency, using advanced systems for real-time inventory tracking and live shipment
              updates. Our goal? To simplify your operations, save costs, and enhance customer satisfaction through
              tailored logistics services that work just for you.
            </p>

            <p className="text-lg font-semibold text-primary">
              FleetGo ensures that every package arrives on time, every time. We're here to redefine the way you think
              about logistics—because at FleetGo, your success is our destination.
            </p>

            <button className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-all duration-300 hover:shadow-lg">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"

const featuresList = [
  {
    icon: "📍",
    title: "Smarter Logistics",
    description: "Technology-driven solutions tailored to your needs.",
  },
  {
    icon: "⚡",
    title: "Faster Deliveries",
    description: "Same-day options to stay ahead in the market.",
  },
  {
    icon: "📦",
    title: "Complete Transparency",
    description: "Live tracking for peace of mind.",
  },
  {
    icon: "👥",
    title: "Customer-First Approach",
    description: "Technology-driven solutions tailored to you.",
  },
]

export default function Features2() {
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
    <section id="features" ref={ref} className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left - Title */}
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              What Makes Us
              <br />
              <span className="text-primary">Stand Out?</span>
            </h2>
          </div>

          {/* Right - First Feature */}
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">{featuresList[0].icon}</div>
              <h3 className="text-2xl font-bold text-foreground mb-3">{featuresList[0].title}</h3>
              <p className="text-gray-600">{featuresList[0].description}</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresList.map((feature, index) => (
            <div
              key={index}
              className={`bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

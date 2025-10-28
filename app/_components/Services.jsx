"use client"

import { useEffect, useRef, useState } from "react"
import { Zap, TrendingUp, Truck, Heart } from "lucide-react"

export default function WhyChoose() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      icon: Zap,
      title: "Smart Logistics Solutions",
      description:
        "At Express Hub, we use the latest technology to make logistics smarter & more efficient. Our system, inspired by the top industry model's software for logistics supply, helps optimize the journey from warehouse to delivery. With Unique Tracking Number for precise inventory tracking & live updates on your shipments, we keep you informed every step of the way.",
      delay: 0,
    },
    {
      icon: TrendingUp,
      title: "Enhanced Efficiency & Cost Savings",
      description:
        "We simplify operations to reduce costs, allowing your business to focus on growth while we handle the logistics. Our solutions save time and money, making it easier for you to stay competitive.",
      delay: 100,
    },
    {
      icon: Truck,
      title: "Same-Day Delivery Options",
      description:
        "With efficient warehousing and delivery management, Express Hub enables same-day delivery to enhance customer satisfaction and keep your business competitive.",
      delay: 200,
    },
    {
      icon: Heart,
      title: "Customer-Centric Experience",
      description:
        "Precision, reliability, and a personalized touch are central to Express Hub. We prioritize your customers' needs, ensuring every delivery is smooth and satisfying.",
      delay: 300,
    },
  ]

  return (
    <section ref={sectionRef} className="py-16 md:py-2 bg-white">
      {/* Yellow Header Section */}
      <div className="bg-accent mb-12 md:mb-16 py-8 md:py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-darker leading-tight">
            Why Express Hub is Your Top Choice?
          </h2>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: isVisible ? `${feature.delay}ms` : "0ms",
                }}
              >
                <div className="h-full flex flex-col">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors duration-300">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-primary-darker mb-2 flex items-center gap-2">
                        {feature.title}
                        <span className="inline-flex items-center gap-0.5 text-accent font-bold text-lg">
                          <span>›</span>
                          <span>›</span>
                          <span>›</span>
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Animated Bottom Border */}
                  <div className="mt-6 h-1 bg-gradient-to-r from-accent to-accent/30 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="mt-16 md:mt-24 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  )
}

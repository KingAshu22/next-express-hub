"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger the animation once the component mounts
    setIsVisible(true)
  }, [])

  return (
    // SECTION: Main hero container
    // Using min-h-screen for better responsiveness on all screen sizes.
    // Added padding for content spacing, especially on mobile.
    <section className="relative w-full min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker overflow-hidden flex items-center pt-24 pb-16 md:pt-12 md:pb-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Centered content container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT CONTENT: Text and CTAs */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Efficient Delivery,
                <br />
                <span className="text-accent">Every Time.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-md leading-relaxed">
                Streamline your logistics with Kargo One. Backed by 10+ years of expertise and innovative technology, we
                deliver precision, speed, and reliability for every shipment.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="px-8 py-4 bg-primary-dark hover:bg-primary-darker text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-white/20">
                Know more
              </button>
              <button className="px-8 py-4 bg-accent hover:bg-accent-dark text-primary font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105">
                Contact us
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT: Image */}
          {/* 
            - Animation has been removed.
            - flex container with `lg:items-end` aligns the image to the bottom on large screens.
            - On smaller screens, it stacks and `items-center` (default) keeps it centered.
          */}
          <div
            className={`relative flex items-center lg:items-end justify-center h-full transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
            style={{ transitionDelay: '200ms' }} // slight delay for better effect
          >
            {/* Simplified image wrapper */}
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-none">
              <Image 
                src={"/Hero.png"} 
                width={800} // Base width for quality
                height={800} // Base height for aspect ratio
                alt="Kargo One delivery professional with packages"
                className="w-full h-auto" // Makes image responsive
                priority // Load the hero image faster
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      {/* The <style jsx> block with the animation has been removed */}
    </section>
  )
}
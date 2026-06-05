# Homepage Redesign - Code Reference

## Quick Code Snippets and Examples

---

## 1. Hero Section - Tracking Form Example

```jsx
// Input field with validation
<div className="flex gap-2">
  <div className="flex-1 relative">
    <input
      id="tracking"
      type="text"
      placeholder="Enter tracking number (e.g., ABC123456)"
      value={trackingNumber}
      onChange={(e) => setTrackingNumber(e.target.value)}
      className="w-full px-4 py-3 rounded-lg border border-slate-300 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 
                 focus:border-transparent transition"
    />
    <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
  </div>
  <Button type="submit" disabled={isLoading}>
    {isLoading ? "Loading..." : "Track"}
  </Button>
</div>

// Form submission handler
const handleTrack = (e) => {
  e.preventDefault();
  if (trackingNumber.trim()) {
    setIsLoading(true);
    router.push(`/track/${trackingNumber}`);
    setTimeout(() => setIsLoading(false), 1000);
  }
};
```

---

## 2. Floating Contact Buttons - Implementation

```jsx
// Call Button
<motion.a
  href="tel:+918169155537"
  className="fixed bottom-8 left-8 z-40 group"
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
  initial={{ opacity: 0, x: -50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.5, duration: 0.5 }}
  aria-label="Call us"
>
  <div className="relative">
    {/* Ripple Effect */}
    <motion.div
      className="absolute inset-0 bg-blue-500 rounded-full"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ opacity: 0.3 }}
    />

    {/* Button */}
    <div className="relative w-14 h-14 bg-gradient-to-r from-blue-600 
                    to-blue-700 rounded-full flex items-center justify-center 
                    shadow-lg hover:shadow-xl transition-all cursor-pointer">
      <Phone className="w-6 h-6 text-white" strokeWidth={2} />
    </div>

    {/* Tooltip */}
    <motion.div className="absolute left-16 top-1/2 -translate-y-1/2 
                           bg-slate-900 text-white px-3 py-2 rounded-lg 
                           text-sm font-medium whitespace-nowrap 
                           pointer-events-none opacity-0 
                           group-hover:opacity-100 transition-opacity">
      Call Us
    </motion.div>
  </div>
</motion.a>
```

---

## 3. Hero Section - Animated Background

```jsx
// Floating blob animations
<motion.div
  className="absolute top-20 right-10 w-72 h-72 bg-blue-100 
             rounded-full blur-3xl opacity-20"
  animate={{ x: [0, 30, 0], y: [0, 30, 0] }}
  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
/>

<motion.div
  className="absolute bottom-10 left-20 w-96 h-96 bg-red-100 
             rounded-full blur-3xl opacity-20"
  animate={{ x: [0, -30, 0], y: [0, -30, 0] }}
  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
/>
```

---

## 4. Features Section - Card with Hover Effects

```jsx
// Feature Card Component
<motion.div
  whileHover={{ y: -8, transition: { duration: 0.3 } }}
  className="group"
>
  <div className="h-full bg-white rounded-2xl p-6 shadow-sm 
                  hover:shadow-xl transition-all duration-300 
                  border border-slate-100 hover:border-slate-200">
    
    {/* Icon Container */}
    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r 
                    ${feature.color} mb-4 flex items-center justify-center 
                    shadow-lg group-hover:scale-110 transition-transform`}>
      <feature.icon className="w-7 h-7 text-white" />
    </div>

    {/* Content */}
    <h3 className="text-lg font-semibold text-slate-900 mb-2 
                   group-hover:text-blue-600 transition-colors">
      {feature.title}
    </h3>
    <p className="text-sm text-slate-600 leading-relaxed">
      {feature.description}
    </p>

    {/* Animated Accent Line */}
    <div className={`h-1 w-0 bg-gradient-to-r ${feature.color} mt-4 
                    group-hover:w-full transition-all duration-300 rounded-full`} />
  </div>
</motion.div>
```

---

## 5. Header - Mobile Menu Implementation

```jsx
// Mobile Menu Toggle
<div className="lg:hidden">
  <button
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    className="p-2 rounded-lg hover:bg-slate-100 transition"
    aria-label="Toggle menu"
  >
    {mobileMenuOpen ? (
      <X className="w-6 h-6 text-slate-700" />
    ) : (
      <Menu className="w-6 h-6 text-slate-700" />
    )}
  </button>
</div>

// Mobile Menu Content
{mobileMenuOpen && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="lg:hidden border-t border-slate-100 py-4 space-y-3"
  >
    {navLinks.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className="block px-4 py-2 text-slate-700 
                   hover:bg-slate-50 rounded-lg transition"
        onClick={() => setMobileMenuOpen(false)}
      >
        {link.label}
      </Link>
    ))}
  </motion.div>
)}
```

---

## 6. Staggered Animation Pattern

```jsx
// Container for staggered animations
<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {items.map((item, index) => (
    <motion.div key={index} variants={itemVariants}>
      {/* Content */}
    </motion.div>
  ))}
</motion.div>

// Animation definitions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,        // Delay between children
      delayChildren: 0.2,          // Initial delay
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};
```

---

## 7. How We Do It - Timeline Steps

```jsx
// Step Card with Counter
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: index * 0.1 }}
  viewport={{ once: true }}
  className="relative"
>
  <div className="h-full bg-gradient-to-br from-slate-50 to-white 
                  rounded-2xl p-6 border border-slate-200 
                  hover:border-blue-300 transition-all 
                  hover:shadow-lg group relative overflow-hidden">
    
    {/* Top accent bar */}
    <div className="absolute top-0 left-0 right-0 h-1 
                    bg-gradient-to-r from-blue-600 to-red-600 
                    transform group-hover:scale-x-100 scale-x-0 
                    origin-left transition-transform duration-300" />

    {/* Step Number Badge */}
    <div className="absolute top-4 right-4 w-10 h-10 rounded-full 
                    bg-gradient-to-r from-blue-600 to-red-600 
                    flex items-center justify-center text-white 
                    font-bold text-sm">
      {index + 1}
    </div>

    {/* Icon */}
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br 
                    from-blue-100 to-red-100 flex items-center 
                    justify-center mb-4 group-hover:scale-110 transition-transform">
      <step.icon className="w-6 h-6 text-blue-600" />
    </div>

    {/* Content */}
    <h3 className="text-lg font-semibold text-slate-900 mb-2">
      {step.title}
    </h3>
    <p className="text-sm text-slate-600 leading-relaxed">
      {step.description}
    </p>
  </div>

  {/* Arrow Connector */}
  {index < steps.length - 1 && (
    <motion.div
      className="hidden lg:flex absolute -right-3 top-1/2 
                 transform -translate-y-1/2 items-center justify-center"
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      viewport={{ once: true }}
    >
      <ArrowRight className="w-5 h-5 text-blue-600 z-10 
                            bg-white px-1 rounded" />
    </motion.div>
  )}
</motion.div>
```

---

## 8. Responsive Grid Examples

```jsx
// Features Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
  {/* Cards */}
</div>

// Hero Grid
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center 
                min-h-[calc(100vh-8rem)]">
  {/* Left Content */}
  {/* Right Content */}
</div>

// How We Do It Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
  {/* Steps */}
</div>

// Statistics
<div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200">
  {/* Stats */}
</div>
```

---

## 9. Gradient Button Styles

```jsx
// Primary Button
<button className="px-8 py-3 rounded-lg font-semibold 
                   bg-gradient-to-r from-blue-600 to-red-600 
                   text-white hover:from-blue-700 hover:to-red-700 
                   transition-all hover:scale-105 disabled:opacity-50">
  Get Started
</button>

// Ghost Button
<button className="px-6 py-3 text-blue-600 hover:bg-blue-50 
                   rounded-lg transition-colors font-medium">
  Learn More
</button>

// Outline Button
<button className="px-6 py-3 rounded-lg border-2 border-slate-300 
                   text-slate-700 hover:bg-slate-50 transition-all">
  Contact Us
</button>
```

---

## 10. Scroll-Triggered Animations

```jsx
// Fade in on scroll
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  viewport={{ once: true }}
>
  Content appears when scrolled into view
</motion.div>

// Viewport options explained
viewport={{
  once: true,        // Animate only once
  amount: 0.8,       // 80% of element must be visible
  margin: "50px",    // Trigger 50px before entering viewport
}}
```

---

## 11. Form Input with Icon

```jsx
// Tracking input with search icon
<div className="flex gap-2">
  <div className="flex-1 relative">
    <input
      type="text"
      placeholder="Enter tracking number"
      className="w-full px-4 py-3 pl-10 rounded-lg border 
                 border-slate-300 focus:outline-none 
                 focus:ring-2 focus:ring-blue-500 transition"
    />
    <Search className="absolute left-3 top-3.5 w-5 h-5 
                       text-slate-400" />
  </div>
  <button type="submit" className="px-6 py-3 ...">
    Search
  </button>
</div>
```

---

## 12. Badge Component

```jsx
// Feature badge
<div className="flex items-center gap-2 bg-blue-50 px-4 py-2 
                rounded-full border border-blue-200">
  <CheckCircle className="w-4 h-4 text-blue-600" />
  <span className="text-sm font-medium text-blue-700">
    Industry-Leading Service Since 2010
  </span>
</div>
```

---

## 13. Statistics Display

```jsx
// Stats grid
<div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200">
  <div>
    <p className="text-2xl md:text-3xl font-bold text-slate-900">
      10M+
    </p>
    <p className="text-sm text-slate-600 mt-1">
      Parcels Shipped
    </p>
  </div>
  <div>
    <p className="text-2xl md:text-3xl font-bold text-slate-900">
      220+
    </p>
    <p className="text-sm text-slate-600 mt-1">
      Delivery Countries
    </p>
  </div>
  <div>
    <p className="text-2xl md:text-3xl font-bold text-slate-900">
      99.2%
    </p>
    <p className="text-sm text-slate-600 mt-1">
      Customer Satisfaction
    </p>
  </div>
</div>
```

---

## 14. Info Card with Features

```jsx
// Modern info card
<div className="relative w-full max-w-md h-96">
  {/* Outer glow */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-200 
                  to-red-200 rounded-3xl blur-2xl opacity-60" />

  {/* Card */}
  <div className="relative bg-white rounded-3xl p-8 shadow-2xl 
                  border border-slate-100">
    {/* Content */}
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-slate-900">
        Seamless Global Shipping
      </h3>
      <p className="text-slate-600">
        With real-time tracking, competitive pricing, and 24/7 support
      </p>
      
      {/* Features */}
      <div className="space-y-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-700">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

---

## 15. Complete Import Template

```jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Phone, 
  MessageCircle, 
  Search, 
  ArrowRight, 
  CheckCircle,
  Menu,
  X,
  Truck,
  Globe,
  Clock,
  Shield
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function YourComponent() {
  // Component code
}
```

---

## Tailwind Classes Reference

### Spacing
```css
p-4   /* padding: 1rem */
px-4  /* padding-left/right: 1rem */
py-3  /* padding-top/bottom: 0.75rem */
mt-4  /* margin-top: 1rem */
gap-6 /* gap: 1.5rem */
```

### Text Styles
```css
text-4xl font-bold text-slate-900 leading-tight
text-sm font-medium text-slate-600
text-balance  /* Better line breaks */
text-pretty   /* Optimized typography */
```

### Backgrounds
```css
bg-white
bg-slate-50
bg-gradient-to-r from-blue-600 to-red-600
bg-blue-100
bg-opacity-20
```

### Borders & Shadows
```css
border border-slate-200
rounded-lg rounded-2xl rounded-full
shadow-sm shadow-lg shadow-xl
hover:shadow-xl transition-all
```

### Display & Layout
```css
flex items-center justify-center gap-4
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6
fixed bottom-8 left-8 z-40
absolute inset-0
relative
```

### Interactive
```css
hover:scale-110 transition-transform
group-hover:opacity-100
disabled:opacity-50
cursor-pointer
```

---

**Last Updated**: June 5, 2026
**Version**: 2.0

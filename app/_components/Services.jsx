import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Truck, Briefcase, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  {
    key: "dropshipping",
    label: "Dropshipping",
    icon: <Truck className="w-5 h-5 mr-2" />,
    image: "/services/dropshipping.png",
    title: "Dropshipping",
    desc: (
      <>
        Whether you run your own online store or a dropshipping hub, we make global shipping simple.  
        <br />
        <br />
        Enjoy door-to-door delivery, no platform fees, and the freedom to scale your business worldwide.
      </>
    ),
    bullets: [
      "Door-to-Door Delivery",
      "No Platform Fees",
    ],
  },
  {
    key: "b2b",
    label: "B2B",
    icon: <Briefcase className="w-5 h-5 mr-2" />,
    image: "/services/b2b.png",
    title: "B2B",
    desc: (
      <>
        Expand into new markets with our competitive rates and fast, reliable air courier services.  
        <br />
        <br />
        We help you move bulk shipments efficiently and handle all customs requirements for you.
      </>
    ),
    bullets: [
      "Multiple Shipping Options",
      "Customs Clearance Support",
    ],
  },
  {
    key: "overseas",
    label: "Overseas Friends and Families",
    icon: <Send className="w-5 h-5 mr-2" />,
    image: "/services/overseas.png",
    title: "Overseas Friends and Families",
    desc: (
      <>
        Send gifts and packages to loved ones abroad with ease.  
        <br />
        <br />
        Our secure, affordable shipping ensures your parcels reach their destination safely—no matter how small or special the occasion.
      </>
    ),
    bullets: [
      "Safe and Secure",
      "Ship as Low as 50 gm",
    ],
  },
];

export default function Services() {
  const [active, setActive] = useState("dropshipping");
  const timerRef = useRef();

  // Auto-switch tabs every 5 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const idx = TABS.findIndex((t) => t.key === prev);
        return TABS[(idx + 1) % TABS.length].key;
      });
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Reset timer on manual tab change
  const handleTabClick = (key) => {
    setActive(key);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const idx = TABS.findIndex((t) => t.key === prev);
        return TABS[(idx + 1) % TABS.length].key;
      });
    }, 5000);
  };

  const tab = TABS.find((t) => t.key === active);

  return (
    <section className="mx-2 rounded-3xl bg-[#06122B] py-16 flex justify-center">
      <div className="w-full max-w-5xl px-4">
        {/* Heading */}
        <h3 className="text-2xl md:text-3xl font-bold text-[#2563eb] mb-1">Our Services</h3>
        <div className="w-32 h-1 bg-yellow-400 rounded mb-2 ml-1" />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          We offer a shipping solution for every need—<br className="hidden md:block" />
          designed just for you!
        </h2>
        <p className="text-gray-300 mb-8 max-w-3xl">
          We’re committed to providing reliable, high-quality shipping that powers your growth.  
          From lightweight parcels to heavy freight, from your warehouse to your customer’s doorstep—let us handle your logistics, so you can focus on your vision.
        </p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-8 bg-[#0B1A3A] rounded-full border border-[#23345D] px-2 py-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabClick(t.key)}
              className={`flex items-center font-semibold px-5 py-2 rounded-full transition 
                ${
                  active === t.key
                    ? "bg-[#06122B] text-yellow-400 shadow border border-yellow-400"
                    : "text-white hover:text-yellow-400"
                } 
                hover:scale-105 focus:scale-105 active:scale-95 duration-200`}
              style={{ outline: "none" }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content with Animation */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-[#0B1A3A] rounded-2xl p-6 md:p-10 shadow-lg min-h-[350px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col md:flex-row items-center gap-8 w-full"
            >
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-1/2"
              >
                <Image
                  src={tab.image}
                  alt={tab.title}
                  width={480}
                  height={320}
                  className="rounded-xl object-cover w-full h-auto"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-1/2 flex flex-col justify-center"
              >
                <h3 className="text-2xl font-bold text-white mb-2">{tab.title}</h3>
                <div className="text-gray-200 text-base md:text-lg mb-4">{tab.desc}</div>
                <ul className="flex flex-wrap gap-4 mb-6">
                  {tab.bullets.map((b, i) => (
                    <li key={i} className="font-semibold text-white text-sm bg-[#2563eb] bg-opacity-20 px-3 py-1 rounded-full">
                      {b}
                    </li>
                  ))}
                </ul>
                <button className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl text-lg transition">
                  Start Shipping
                </button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
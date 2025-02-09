import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Typewriter } from 'react-simple-typewriter';

export default function Hero() {
  const router = useRouter();
  return (
    <div className="pt-20 bg-gradient-to-b from-[#F8F9FF] to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#232C65] leading-tight">
              Cross-Border Shipping:{" "}<br />
              <span className="relative inline-block text-[#E31E24]">
                <Typewriter
                  words={[
                    "Made Affordable",
                    "Fast and Reliable",
                    "Secure and Efficient",
                    "Tailored for You",
                  ]}
                  loop
                  cursor
                  cursorStyle="_"
                  typeSpeed={70}
                  deleteSpeed={50}
                  delaySpeed={1000}
                />
                <span className="absolute inset-x-0 bottom-2 h-3 bg-yellow-300 -z-10"></span>
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              We provide fast, reliable international deliveries at{" "}
              <span className="text-[#E31E24]">surprisingly low prices</span>.
            </p>
            <div className="flex flex-row gap-4">
              <Button
                className="bg-[#fff] hover:bg-[#C71D23] text-#E31E24 border border-[#E31E24] rounded-md px-8 py-3 flex items-center space-x-2"
                onClick={() => {
                  router.push("tel:+918169155537");
                }}
              >
                <span>Ask us how?</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                className="bg-[#E31E24] hover:bg-[#C71D23] text-white rounded-md px-6"
                onClick={() => router.push("/track")}
              >
                Track Parcel
              </Button>
            </div>
          </div>
          <div className="relative h-[400px] lg:h-[500px]">
            <Image
              src="/hero.jpg"
              alt="Warehouse worker with packages"
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}

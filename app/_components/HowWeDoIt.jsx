import Image from "next/image";
import { CheckCircle } from "lucide-react";

const steps = [
  "Book your shipment online or through our customer service",
  "We pick up your package from your location",
  "Package is processed at our sorting facility",
  "International shipping via our global network",
  "Last-mile delivery to the recipient",
];

export default function HowWeDoIt() {
  return (
    <section className="py-4 bg-gray-50" id="how-we-do-it">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-[#232C65]">
              <span className="relative inline-block">
                How We Do It
                <span className="absolute inset-x-0 bottom-2 h-3 bg-yellow-300 -z-10"></span>
              </span>
            </h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-[#E31E24] flex-shrink-0 mt-1" />
                  <p className="text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[550px] w-full rounded-lg overflow-hidden">
            <Image
              src="/how-we-do-it-web.svg"
              alt="Shipping Process"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

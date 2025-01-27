import { Truck, Globe, Clock, Shield } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Door-to-Door Delivery",
    description: "We handle pickup and delivery to any location worldwide",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "International shipping to over 200 countries and territories",
  },
  {
    icon: Clock,
    title: "Fast Transit Times",
    description: "Express delivery options with guaranteed delivery dates",
  },
  {
    icon: Shield,
    title: "Secure Shipping",
    description: "Full tracking and insurance coverage for your shipments",
  },
];

export default function Features() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <feature.icon className="w-12 h-12 text-[#E31E24] mb-4" />
              <h3 className="text-xl font-semibold text-[#232C65] mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

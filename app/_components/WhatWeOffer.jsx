import Image from "next/image";

const services = [
  {
    title: "Air Freight",
    description: "Efficient transportation for larger cargo",
    image: "/air-cargo.jpg",
  },
  {
    title: "Sea Freight",
    description: "Cost-effective solution for bulk shipments",
    image: "/sea.jpg",
  },
];

export default function WhatWeOffer() {
  return (
    <section className="py-20" id="what-we-offer">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-[#232C65] text-center mb-12">
          <span className="relative inline-block">
            What we offer
            <span className="absolute inset-x-0 bottom-2 h-3 bg-yellow-300 -z-10"></span>
          </span>
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-lg overflow-hidden shadow-md"
            >
              <Image
                src={service.image || "/placeholder.svg"}
                alt={service.title}
                width={500}
                height={600}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#232C65] mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

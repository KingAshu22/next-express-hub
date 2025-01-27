const stats = [
  { number: "15+", label: "Years Experience" },
  { number: "200+", label: "Countries Served" },
  { number: "1M+", label: "Packages Delivered" },
  { number: "99%", label: "Customer Satisfaction" },
];

export default function Experience() {
  return (
    <section className="py-20 bg-[#232C65]" id="our-experience">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-white mb-16">
          <span className="relative inline-block">
            Our Experience
            <span className="absolute inset-x-0 bottom-2 h-3 bg-yellow-300 opacity-50 -z-10"></span>
          </span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

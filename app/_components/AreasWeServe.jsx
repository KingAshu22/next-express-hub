import Image from "next/image";

const countries = [
    {
        flag: "https://flagicons.lipis.dev/flags/4x3/us.svg",
        title: "USA"
    },
    {
        flag: "https://flagicons.lipis.dev/flags/4x3/ca.svg",
        title: "Canada"
    },
    {
        flag: "https://flagicons.lipis.dev/flags/4x3/au.svg",
        title: "Australia"
    },
    {
        flag: "https://flagicons.lipis.dev/flags/4x3/gb.svg",
        title: "United Kingdom"
    },
    {
        flag: "https://flagicons.lipis.dev/flags/4x3/eu.svg",
        title: "Europe"
    },
    {
        flag: "https://flagicons.lipis.dev/flags/4x3/ae.svg",
        title: "UAE & Other Gulf Countries"
    },
];

export default function AreasWeServe() {
    return (
        <section className="py-16 bg-gray-50">
            <h2 className="text-4xl font-bold text-[#232C65] text-center mb-12">
                <span className="relative inline-block">
                    Areas We Serve
                    <span className="absolute inset-x-0 bottom-2 h-3 bg-yellow-300 -z-10"></span>
                </span>
            </h2>
            <p className="text-center font-semibold text-lg pb-4">Door to Door Service | Express & Economy Service to below countries:</p>
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {countries.map((country, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center align-center"
                        >
                            <Image
                                src={country.flag}
                                alt={country.title}
                                className="ml-2 mb-2"
                                width={150}
                                height={150}
                            />
                            <h3 className="text-xl font-semibold text-[#232C65] mb-2">
                                {country.title}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

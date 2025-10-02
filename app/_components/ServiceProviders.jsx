import Image from "next/image";

const partners = [
    { name: "DHL", src: "https://upload.wikimedia.org/wikipedia/commons/archive/a/ac/20250507094329%21DHL_Logo.svg", width: 200, height: 40 },
    { name: "FedEx", src: "https://cdn.worldvectorlogo.com/logos/fedex-express-6.svg", width: 200, height: 40 },
    { name: "UPS", src: "https://cdn.worldvectorlogo.com/logos/ups-logo-1.svg", width: 60, height: 40 },
    { name: "Aramex", src: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Aramex_logo.svg", width: 200, height: 40 },
];

export default function ServiceProviders() {
    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-[#23345D] mb-10">
                    We Ship With Leading Service Providers
                </h2>
                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
                    {partners.map((partner) => (
                        <div key={partner.name} className="flex items-center justify-center">
                            <Image
                                src={partner.src}
                                alt={partner.name}
                                width={partner.width}
                                height={partner.height}
                                className="object-contain"
                                priority
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
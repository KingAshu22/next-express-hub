import Image from "next/image";

const partners = [
    { name: "Amazon", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/905px-Amazon_logo.svg.png?20250504041148", width: 100, height: 40 },
    { name: "Shopify", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/768px-Shopify_logo_2018.svg.png?20240107131458", width: 100, height: 40 },
    { name: "Walmart", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Walmart_logo.svg/768px-Walmart_logo.svg.png?20220910022324", width: 100, height: 40 },
    { name: "eBay", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/EBay_logo.svg/1200px-EBay_logo.svg.png?20250125101251", width: 100, height: 40 },
    { name: "Etsy", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Etsy_logo.svg/768px-Etsy_logo.svg.png?20210602130042", width: 100, height: 40 },
];

export default function Partners() {
    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-[#23345D] mb-10">
                    We help our partners grow globally on
                </h2>
                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
                    {partners.map((partner) => (
                        <div key={partner.name} className="flex items-center justify-center">
                            <Image
                                src={partner.src}
                                alt={partner.name}
                                width={partner.width}
                                height={partner.height}
                                className="object-contain h-10 w-auto"
                                priority
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
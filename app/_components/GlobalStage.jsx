import { UserPlus, FileSearch, PackageCheck, Send, PlaneTakeoff } from "lucide-react";
import Image from "next/image";

export default function GlobalStage() {
    return (
        <section className="py-16 bg-white w-full flex justify-center">
            <div className="w-full max-w-6xl px-4">
                {/* Heading */}
                <h2 className="text-3xl md:text-4xl font-bold text-[#2563eb] mb-2">
                    Showcase your product to the world
                </h2>
                <div className="w-32 h-2 bg-yellow-400 rounded mb-4" />
                <p className="text-lg text-gray-700 mb-10 max-w-3xl">
                    Get started in just a few minutes with three simple steps. Our intuitive dashboard walks you through every stage, from registration to global delivery—no hassle, no confusion.
                </p>

                {/* Steps */}
                <div className="flex flex-col md:flex-row gap-6 mb-10">
                    {/* Step 1 */}
                    <div className="flex-1 bg-blue-50 rounded-2xl p-8 flex flex-row items-start shadow-sm transition-transform duration-200 hover:scale-95 cursor-pointer hover:border-2 border-blue-500">
                        <Image
                            src="/icons/step-1.gif"
                            alt="Step 1: Fill in your shipment details"
                            width={100}
                            height={100}
                        />
                        <div>
                            <span className="font-bold text-lg mb-1">STEP ONE</span>
                            <p className="text-gray-600">
                                Fill in your shipment details to create your order.
                            </p>
                        </div>
                    </div>
                    {/* Step 2 */}
                    <div className="flex-1 bg-blue-50 rounded-2xl p-8 flex flex-row items-start shadow-sm transition-transform duration-200 hover:scale-95 cursor-pointer hover:border-2 border-blue-500">
                        <Image
                            src="/icons/step-2.gif"
                            alt="Step 2: Review shipping options"
                            width={100}
                            height={100}
                        />
                        <div>
                            <span className="font-bold text-lg mb-1">STEP TWO</span>
                        <p className="text-gray-600">
                            Review shipping options and select the best fit for your business.
                        </p>
                        </div>
                    </div>
                    {/* Step 3 */}
                    <div className="flex-1 bg-blue-50 rounded-2xl p-8 flex flex-row items-start shadow-sm transition-transform duration-200 hover:scale-95 cursor-pointer hover:border-2 border-blue-500">
                        <Image
                            src="/icons/step-3.gif"
                            alt="Step 3: Schedule your pickup"
                            width={100}
                            height={100}
                        />
                        <div>
                            <span className="font-bold text-lg mb-1">STEP THREE</span>
                        <p className="text-gray-600">
                            Schedule your pickup and let us handle the rest—your shipment is on its way!
                        </p>
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl text-lg flex items-center gap-2 transition">
                    Start Now <PlaneTakeoff className="w-5 h-5" />
                </button>
            </div>
        </section>
    );
}
"use client";

import Footer from "@/app/_components/Footer";
import FrontHeader from "@/app/_components/FrontHeader";

export default function RefundsCancellationPage() {
    return (
        <>
            <FrontHeader />
            <main className="bg-[#f8f9ff] min-h-screen py-12 px-4 mt-12">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#232C65] mb-2">
                        Refunds & Cancellation Policy
                    </h1>
                    <div className="w-32 h-2 bg-yellow-400 rounded mb-6" />

                    <section className="space-y-8 text-gray-800 text-justify">

                        <div>
                            <h2 className="text-xl font-bold text-[#2563eb] mb-2">Returns</h2>
                            <p>
                                We do not accept RTOs once the shipment has been received at our hub. In case the shipment is in transit to our hub, and you wish to cancel, please write to us at support@shipglobal.in or call our customer care at 022-60605556 with details.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-[#2563eb] mb-2">Cancellation</h2>
                            <p>
                                You can cancel the order anytime before it gets in-warded at our hub. Once you request for cancellation of your order, it will take 1-2 business days for the cancellation to reflect in our systems. The same will be notified to you by email. We will refund the entire amount within 7-10 working days.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
}
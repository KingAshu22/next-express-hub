import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CTA() {
  const router = useRouter();
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-[#232C65]">
            Ready to Ship with Us?
          </h2>
          <p className="text-xl text-gray-600">
            Experience hassle-free international shipping at competitive rates
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#E31E24] hover:bg-[#C71D23] text-white px-8 py-3 text-lg" onClick={() => { router.push("tel:+918169155537") }}>
              Get a Quote
            </Button>
            <Button
              variant="outline"
              className="border-[#E31E24] text-[#E31E24] hover:bg-red-50 px-8 py-3 text-lg"
              onClick={() => { router.push("tel:+918169155537") }}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

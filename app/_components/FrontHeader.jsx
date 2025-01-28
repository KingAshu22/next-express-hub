import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function FrontHeader() {
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.jpg"
              alt="Redly Express Logo"
              width={180}
              height={40}
            />
          </Link>

          <nav className="hidden lg:flex items-center space-x-8 font-bold">
            <Link
              href="#what-we-offer"
              className="text-[#232C65] hover:text-[#E31E24] transition-colors"
            >
              What We Offer
            </Link>
            <Link
              href="#how-we-do-it"
              className="text-[#232C65] hover:text-[#E31E24] transition-colors"
            >
              How We Do It
            </Link>
            <Link
              href="#our-experience"
              className="text-[#232C65] hover:text-[#E31E24] transition-colors"
            >
              Our Experience
            </Link>
          </nav>

          <div className="flex items-center space-x-4 font-bold">
            <Link
              href="https://wa.me/918169155537"
              className="hidden md:inline-block text-sm text-[#232C65] hover:text-[#E31E24] transition-colors"
            >
              Whatsapp Us
            </Link>
            <Link
              href="/dashboard"
              className="hidden md:inline-block text-sm text-[#232C65] hover:text-[#E31E24] transition-colors"
            >
              Login
            </Link>
            <Button
              className="bg-[#E31E24] hover:bg-[#C71D23] text-white rounded-md px-6"
              onClick={() => router.push("/track")}
            >
              Track Parcel
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

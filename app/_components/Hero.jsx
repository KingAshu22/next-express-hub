import { Button } from "@/components/ui/button";
import { Phone, ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    // Added padding for better spacing on all devices
    <section className="relative bg-accent overflow-hidden">
      {/* Decorative background gradient element */}
      <div
        aria-hidden="true"
        className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20"
      >
        <div className="blur-[106px] h-56 bg-gradient-to-br from-accent to-purple-400 dark:from-blue-700"></div>
        <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
      </div>

      <div className="container mx-auto px-6 py-20 md:py-28 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16 items-center">
          
          {/* Left Content: Text and CTAs */}
          {/* Centered on mobile, left-aligned on desktop */}
          <div className="relative z-10 space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-foreground leading-tight">
                Ship More,
                <br />
                <span className="text-primary">Spend Less</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0">
                Seamless and affordable international courier services, right from India.
              </p>
            </div>

            {/* Price Box */}
            <div className="inline-block mx-auto lg:mx-0">
              {/* Glassmorphism effect: more modern */}
              <div className="border-2 border-primary/50 rounded-2xl p-6 bg-background/30 backdrop-blur-sm shadow-lg">
                <div className="text-center">
                  <p className="text-5xl md:text-6xl font-bold text-primary">₹550</p>
                  <p className="text-lg text-muted-foreground mt-1">+ GST</p>
                  <div className="h-0.5 w-full bg-primary/30 my-3 rounded"></div>
                  <p className="text-2xl font-semibold text-foreground">per Kg</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <p className="text-lg font-semibold text-foreground">
                Reliable, Fast & On-Time Deliveries. Guaranteed.
              </p>

              {/* CTA Buttons: Using the shadcn/ui Button component */}
              {/* Centered on mobile, aligned left on desktop */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="group w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  <Phone className="mr-2 h-5 w-5" />
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>

          {/* Right Content: Image */}
          {/* Added a subtle container and shadow for a "lifted" feel */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-md lg:max-w-none p-4">
               <div className="backdrop-blur-sm overflow-hidden">
                <img
                    src="/hero.png"
                    alt="Courier professional holding packages with a global network graphic"
                    className="w-full h-auto object-cover transition-transform duration-500 lg:hover:scale-105"
                />
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
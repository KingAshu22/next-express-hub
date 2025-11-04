import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

const countries = [
  { name: "United States", flag: "🇺🇸", rate: "₹650" },
  { name: "United Kingdom", flag: "🇬🇧", rate: "₹620" },
  { name: "Canada", flag: "🇨🇦", rate: "₹680" },
  { name: "Australia", flag: "🇦🇺", rate: "₹720" },
  { name: "UAE", flag: "🇦🇪", rate: "₹580" },
  { name: "Singapore", flag: "🇸🇬", rate: "₹640" },
  { name: "Germany", flag: "🇩🇪", rate: "₹630" },
  { name: "France", flag: "🇫🇷", rate: "₹630" },
  { name: "Japan", flag: "🇯🇵", rate: "₹700" },
  { name: "China", flag: "🇨🇳", rate: "₹660" },
  { name: "Saudi Arabia", flag: "🇸🇦", rate: "₹590" },
  { name: "Netherlands", flag: "🇳🇱", rate: "₹640" },
];

const InternationalRatesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Package className="h-8 w-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">
              International Shipping Rates
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Competitive rates to ship from India to major destinations worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {countries.map((country, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all hover:scale-105 border-2"
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="text-6xl mb-2">{country.flag}</div>
                <h3 className="font-semibold text-lg">{country.name}</h3>
                <div className="pt-2 border-t border-border">
                  <p className="text-3xl font-bold text-primary">{country.rate}</p>
                  <p className="text-sm text-muted-foreground">per Kg</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            *Rates are indicative and may vary based on package dimensions, weight, and destination zone. GST applicable.
          </p>
        </div>
      </div>
    </section>
  );
};

export default InternationalRatesSection;

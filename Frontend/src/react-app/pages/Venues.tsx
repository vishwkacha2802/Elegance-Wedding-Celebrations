import { Link } from "react-router";
import { MapPin, Users, ArrowRight, Check } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { venues } from "@/react-app/data/content";

export default function VenuesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section
        className="relative h-[60vh] flex items-center justify-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative text-center px-4">
          <p className="text-white/80 tracking-wider uppercase text-sm mb-3">Find Your Space</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-script text-white">Our Venues</h1>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
            Perfect Locations
          </p>
          <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
            Handpicked Venues for Your Special Day
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We've partnered with the most stunning venues to offer you a curated selection of
            locations that provide the perfect backdrop for your celebration. From grand ballrooms
            to intimate gardens, each venue has been chosen for its exceptional service and
            breathtaking beauty.
          </p>
        </div>
      </section>

      {/* Venues Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {venues.map((venue) => (
              <Card
                key={venue.id}
                className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="aspect-square md:aspect-auto overflow-hidden">
                    <img
                      src={venue.image}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6 flex flex-col justify-center">
                    <h3 className="text-xl font-semibold text-foreground mb-2">{venue.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <MapPin className="w-4 h-4 text-mauve" />
                      {venue.location}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <Users className="w-4 h-4 text-mauve" />
                      {venue.capacity}
                    </div>
                    <ul className="space-y-2 mb-6">
                      {venue.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-mauve" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/contact">
                      <Button
                        variant="outline"
                        className="w-full border-mauve text-mauve hover:bg-mauve hover:text-white"
                      >
                        Inquire About This Venue
                      </Button>
                    </Link>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blush">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We work with many more venues than listed here. Tell us about your dream location, and
            we'll help you find the perfect match.
          </p>
          <Link to="/contact">
            <Button className="bg-magenta hover:bg-magenta/90 text-white">
              Contact Us
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

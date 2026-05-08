import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";

const serviceCategories = [
  {
    id: "mehendi",
    title: "Haldi & Mehendi",
    subtitle: "Traditional Rituals",
    description:
      "These pre-wedding rituals are filled with color, joy, and tradition. We create beautiful settings that honor these ceremonies while adding modern touches.",
    image: "/src/img/haldi&mehndi.png",
    features: [
      "Traditional setup and décor",
      "Professional Mehendi artists",
      "Colorful themed styling",
      "Music and entertainment",
      "Photography coordination",
      "Refreshments and catering",
    ],
  },
  {
    id: "sangeet",
    title: "Sangeet Night",
    subtitle: "Music & Dance",
    description:
      "A night of music, dance, and pure joy! The Sangeet is a beloved tradition that brings families together in celebration. We create an unforgettable party atmosphere.",
    image: "/src/img/sangeet.png",
    features: [
      "Stage and performance setup",
      "Professional DJ and sound",
      "Garba",
      "Performance coordination",
      "Themed décor",
      "Food and beverage service",
    ],
  },
  {
    id: "ceremony",
    title: "Marriage Ceremony",
    subtitle: "Sacred Beginnings",
    description:
      "The ceremony is the heart of your wedding day—the moment when two lives become one. We work with you to create a ceremony that honors your traditions while reflecting your unique love story.",
    image: "/src/img/marriage.png",
    features: [
      "Venue selection and setup",
      "Décor and floral arrangements",
      "Music and sound coordination",
      "Officiant recommendations",
      "Seating arrangements",
      "Ceremony timeline planning",
    ],
  },
  {
    id: "reception",
    title: "Grand Reception",
    subtitle: "Celebrate in Style",
    description:
      "Your reception is where the celebration truly begins. From elegant tablescapes to spectacular entertainment, we create an unforgettable experience for you and your guests.",
    image: "/src/img/reception.png",
    features: [
      "Venue transformation and décor",
      "Catering and menu curation",
      "Entertainment and DJ coordination",
      "Lighting and ambiance design",
      "Guest experience planning",
      "Timeline and flow management",
    ],
  },
];

const packages = [
  {
    name: "Essential",
    description: "Perfect for couples who need guidance and coordination",
    features: [
      "Initial consultation",
      "Day-of coordination",
      "Vendor recommendations",
      "Timeline creation",
      "Ceremony rehearsal",
    ],
  },
  {
    name: "Premium",
    description: "Comprehensive planning for a stress-free experience",
    popular: true,
    features: [
      "Everything in Essential",
      "Full planning services",
      "Budget management",
      "Vendor negotiations",
      "Design and décor",
      "Multiple event coordination",
    ],
  },
  {
    name: "Luxury",
    description: "The ultimate bespoke wedding experience",
    features: [
      "Everything in Premium",
      "Dedicated planner team",
      "Custom design concepts",
      "Destination wedding support",
      "Guest concierge services",
      "Post-wedding coordination",
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section
        className="relative h-[60vh] flex items-center justify-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative text-center px-4">
          <p className="text-white/80 tracking-wider uppercase text-sm mb-3">What We Offer</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-script text-white">Our Services</h1>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {serviceCategories.map((service, index) => (
            <div
              key={service.id}
              id={service.id}
              className={`flex flex-col lg:flex-row gap-12 items-center mb-24 last:mb-0 ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1">
                <img
                  src={service.image}
                  alt={service.title}
                  className="rounded-lg shadow-xl w-full aspect-[4/3] object-cover"
                />
              </div>

              <div className="flex-1">
                <span className="text-mauve font-medium tracking-wider uppercase text-sm">
                  {service.subtitle}
                </span>
                <h2 className="text-3xl sm:text-4xl font-script text-foreground mt-2 mb-6">
                  {service.title}
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-mauve flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/contact">
                  <Button className="bg-magenta hover:bg-magenta/90 text-white">
                    Inquire Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-blush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
              Our Packages
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-foreground">
              Choose Your Experience
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <Card
                key={pkg.name}
                className={`relative border-none shadow-lg transition-all duration-300
                  hover:ring-2 hover:ring-blue-500 hover:scale-[1.02]
                `}
              >
                {pkg.popular && (
                  <div className="absolute -top--1 left-1/2 -translate-x-1/2 bg-mauve text-white px-4 py-1 rounded-full text-sm">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-foreground mb-2">{pkg.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{pkg.description}</p>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-mauve flex-shrink-0" />
                        <span className="text-muted-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/contact">
                    <Button
                      className="w-full bg-transparent border border-mauve text-mauve
                      hover:bg-magenta hover:text-white transition-all duration-300"
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
            Let's Create Something Beautiful Together
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Every wedding is unique, and so is our approach. Contact us to discuss your vision and
            how we can bring it to life.
          </p>
          <Link to="/contact">
            <Button className="bg-magenta hover:bg-magenta/90 text-white">
              Schedule a Consultation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

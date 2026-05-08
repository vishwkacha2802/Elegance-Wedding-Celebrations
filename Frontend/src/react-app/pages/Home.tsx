import { Link } from "react-router";
import { ArrowRight,Heart } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import HeroCarousel from "@/react-app/components/HeroCarousel";
import { services, portfolio } from "@/react-app/data/content";
// import { testimonials, processSteps } from "@/react-app/data/content";
// import AuthModal from "../components/AuthModel";

const serviceImages: Record<string, string> = {
  ceremony: "/src/img/marriage.png",
  reception: "/src/img/reception.png",
  sangeet: "/src/img/sangeet.png",
  mehendi: "/src/img/haldi&mehndi_2.png",
};

export default function Home() {
  // const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Services Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
              What We Offer
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-foreground">
              Our Services
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Link
                key={service.id}
                to={`/services#${service.id}`}
                className="group relative overflow-hidden rounded-lg aspect-[3/4] block"
              >
                <img
                  src={serviceImages[service.id] ?? service.image}
                  alt={service.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
                  <p className="text-white/80 text-sm">{service.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80"
                alt="Wedding planning"
                loading="lazy"
                decoding="async"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-mauve text-white p-6 rounded-lg hidden sm:block">
                <div className="text-4xl font-bold">15+</div>
                <div className="text-sm opacity-80">Years Experience</div>
              </div>
            </div>

            <div>
              <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
                About Us
              </p>
              <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
                Creating Magical Celebrations Since 2009
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                At Elegance Weddings, we believe every love story deserves a celebration as unique
                as the couple themselves. With over a decade of experience, we've had the privilege
                of crafting hundreds of dream weddings.
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Our team of passionate planners, designers, and coordinators work tirelessly to
                transform your vision into reality, handling every detail with care and creativity.
              </p>
              <Link to="/about">
                <Button className="bg-magenta hover:bg-magenta/90 text-white">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Carousel */}
      <section className="py-20 bg-blush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
              Our Work
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-foreground">
              Carousel of Celebrations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <Card
                key={item.id}
                className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-5">
                  <span className="text-xs text-mauve font-medium tracking-wider uppercase">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground mt-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.couple}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/services">
              <Button variant="outline" className="border-mauve text-mauve hover:bg-mauve hover:text-white">
                View All Projects
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      {/* <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
              How We Work
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-foreground">
              Our Process
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={step.step} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-mauve text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  {step.step}
                </div>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-mauve/20" />
                )}
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/process">
              <Button className="bg-magenta hover:bg-magenta/90 text-white">
                Learn More About Our Process
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/* Testimonials */}
      {/* <section className="py-20 bg-gradient-to-b from-cream to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-foreground">
              Sweet Words  
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-none shadow-lg">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-mauve fill-mauve" />
                    ))}
                  </div>
                  <p className="text-foreground italic mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.couple}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.couple}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/testimonials">
              <Button variant="outline" className="border-mauve text-mauve hover:bg-mauve hover:text-white">
                Read More Reviews
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section
        className="py-24 relative"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-white mb-6">
            Let's Create Your Dream Wedding
          </h2>
          <p className="text-white/80 mb-8 text-lg max-w-2xl mx-auto">
            Ready to begin planning the most magical day of your life? We'd love to hear your story
            and help bring your vision to life.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-magenta hover:bg-magenta/90 text-white px-8">
              Get in Touch
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { Link } from "react-router";
import { ArrowRight, Award, Heart, Users, Calendar } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { teamMembers } from "@/react-app/data/content";

const stats = [
  { icon: Heart, value: "500+", label: "Weddings Planned" },
  { icon: Users, value: "10,000+", label: "Happy Guests" },
  { icon: Award, value: "25+", label: "Awards Won" },
  { icon: Calendar, value: "15+", label: "Years Experience" },
];

export default function AboutPage() {
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
          <p className="text-white/80 tracking-wider uppercase text-sm mb-3">Our Story</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-script text-white">About Us</h1>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
                Our Journey
              </p>
              <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
                Where It All Began
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Elegance Weddings was born from a simple belief: every couple deserves a wedding day
                that reflects their unique love story. Founded in 2009 by Sophia Chen, our company
                started as a small boutique planning service with a passion for creating
                unforgettable moments.
              </p>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Over the years, we've grown into a full-service wedding planning company, but our
                core values remain the same. We believe in the power of attention to detail, the
                importance of personal connections, and the magic that happens when creativity meets
                careful planning.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, our team of dedicated planners, designers, and coordinators work together to
                bring your dream wedding to life. From intimate garden ceremonies to grand ballroom
                celebrations, we've had the honor of being part of hundreds of love stories.
              </p>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80"
                alt="Wedding celebration"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-mauve text-white p-6 rounded-lg hidden sm:block">
                <p className="font-script text-2xl">"Love is in the details"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-16 h-16 rounded-full bg-mauve/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-mauve" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
              The People Behind the Magic
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-foreground">
              Meet Our Team
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.id} className="overflow-hidden border-none shadow-lg">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
                  <p className="text-mauve text-sm mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
              What We Stand For
            </p>
            <h2 className="text-3xl sm:text-4xl font-script text-foreground">Our Values</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Attention to Detail",
                description:
                  "Every flower, every candle, every moment is carefully considered to create a cohesive and beautiful experience.",
              },
              {
                title: "Personal Connection",
                description:
                  "We take the time to understand your story, your style, and your dreams to create something truly unique.",
              },
              {
                title: "Stress-Free Planning",
                description:
                  "Your journey to the altar should be joyful. We handle the logistics so you can enjoy every moment.",
              },
            ].map((value) => (
              <div key={value.title} className="text-center p-8 bg-background rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-foreground mb-4">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We'd love to hear about your wedding vision and discuss how we can help make it a
            reality.
          </p>
          <Link to="/contact">
            <Button className="bg-magenta hover:bg-magenta/90 text-white">
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

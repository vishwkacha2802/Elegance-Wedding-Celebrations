import { Heart, Sparkles, Users, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@user/react-app/components/ui/button";
import { Link } from "react-router";


export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blush via-champagne to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-64 h-64 bg-rose/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gold/20 rounded-full blur-3xl" />
        </div>
        
        {/* Navigation */}
        <nav className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/favicon-elegance.svg"
              alt="Elegance Weddings logo"
              className="h-10 w-10 shrink-0 rounded-xl shadow-lg shadow-rose/20"
            />
            <span className="min-w-0 text-balance font-display text-lg font-semibold text-foreground sm:text-2xl">
              Elegance Wedding & Celebrations
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* <Link to="/couple">
              <Button variant="ghost" className="text-foreground hover:bg-rose/10">
                Couple Dashboard
              </Button>
            </Link> */}
            <Link to="/couple">
              <Button className="h-11 w-full sm:w-auto bg-gradient-to-r from-gold to-amber-500 text-white shadow-lg shadow-gold/25 hover:opacity-90">
                Login/Register
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-rose/20 mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-foreground">Intelligent Wedding Planning</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
              Plan Your Perfect
              <span className="block bg-gradient-to-r from-rose to-gold bg-clip-text text-transparent">
                Wedding Together
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A smart dashboard for both bride and groom to collaborate on wedding planning. 
              Get personalized vendor recommendations based on your budget, location, and preferences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* <Link to="/couple">
                <Button onClick={() => setOpen(true)} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-rose to-primary text-white shadow-xl shadow-rose/30 hover:shadow-rose/40 hover:opacity-95 text-lg px-8 py-6">
                  <Heart className="w-5 h-5 mr-2" />
                  Enter Dashboard
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link to="/couple">
                <Button onClick={() => setOpen(true)} size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gold/40 bg-white/50 backdrop-blur-sm hover:bg-gold/10 text-foreground text-lg px-8 py-6">
                  <Users className="w-5 h-5 mr-2" />
                  Plan Together
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button> */}

                <Link to="/couple">
                <Button size="lg" className="bg-gradient-to-r from-rose to-gold text-white shadow-xl hover:opacity-95 text-lg px-10 py-6">
                  <Heart className= "w-5 h-5 ml-2" />
                  Start Planning Now
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              {/* </Link> */}
            </div>
          </div>
        </div>
        
        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </header>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Plan Together
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Both bride and groom get their own dashboard while contributing to a shared wedding plan
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Smart Vendor Matching"
            description="Select your required services and get AI-powered vendor recommendations based on your budget and location"
            gradient="from-rose/20 to-gold/20"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Dual Dashboards"
            description="Separate login credentials for bride and groom, each with their own preferences while sharing the overall plan"
            gradient="from-gold/20 to-rose/20"
          />
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Progress Tracking"
            description="Keep track of bookings, payments, and planning milestones all in one beautiful dashboard"
            gradient="from-rose/20 to-champagne/40"
          />
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gradient-to-b from-background to-blush/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              All Wedding Services Covered
            </h2>
            <p className="text-muted-foreground text-lg">
              Select the services you need and we'll find the perfect vendors
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {["Venue", "Catering", "Photography", "Videography", "Decoration", "Makeup", "Music & DJ", "Flowers", "Invitations", "Transportation", "Cake", "Jewelry"].map((service) => (
              <div
                key={service}
                className="px-5 py-3 rounded-full bg-white border border-rose/20 shadow-sm hover:shadow-md hover:border-rose/40 transition-all cursor-default"
              >
                <span className="text-foreground font-medium">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose/10 via-gold/10 to-rose/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl border border-rose/20 bg-white/80 p-8 shadow-xl backdrop-blur-sm sm:p-12 md:p-16">
              <Heart className="w-12 h-12 text-rose mx-auto mb-6" />
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Start Planning?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Create your wedding dashboard today and start collaborating with your partner on your perfect day
              </p>
              
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-2">
            <img
              src="/favicon-elegance.svg"
              alt="Elegance Weddings logo"
              className="h-8 w-8 shrink-0 rounded-lg"
            />
            <span className="font-display text-lg font-semibold text-foreground">Elegance Wedding & Celebrations</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Elegance Wedding & Celebrations. Made with love for your special day.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative bg-white rounded-2xl border border-rose/10 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose/10 to-gold/10 flex items-center justify-center text-rose mb-6">
          {icon}
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}


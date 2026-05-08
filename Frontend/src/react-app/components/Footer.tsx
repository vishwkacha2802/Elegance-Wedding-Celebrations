import { Link } from "react-router";
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2a2a2a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="mb-6 inline-block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose to-gold shadow-lg shadow-rose/20">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-3xl font-script text-mauve">Elegance</span>
                  <span className="block text-[10px] uppercase tracking-[0.3em] text-gray-400">
                    weddings & celebrations
                  </span>
                </div>
              </div>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Creating unforgettable celebrations with elegance, creativity, and attention to every
              precious detail.
            </p>
            <div className="flex flex-wrap gap-3">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-mauve"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: "About Us", path: "/about" },
                { name: "Our Services", path: "/services" },
                { name: "Venues", path: "/venues" },
                { name: "Blog", path: "/blog" },
                { name: "Contact", path: "/contact" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 transition-colors hover:text-mauve"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-semibold">Our Services</h3>
            <ul className="space-y-3">
              {["Wedding Ceremony", "Reception", "Sangeet Night", "Haldi & Mehendi", "Destination Weddings"].map(
                (service) => (
                  <li key={service}>
                    <Link
                      to="/services"
                      className="text-sm text-gray-400 transition-colors hover:text-mauve"
                    >
                      {service}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-semibold">Get in Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-mauve" />
                <span className="text-sm text-gray-400">
                  C.G Road
                  <br />
                  Gujarat, India 
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-mauve" />
                <a href="tel:+1234567890" className="text-sm text-gray-400 hover:text-mauve">
                  +91 9684512365
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-mauve" />
                <a
                  href="mailto:hello@eleganceweddings.com"
                  className="break-all text-sm text-gray-400 hover:text-mauve"
                >
                  support.elegancewedding@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Elegance Weddings. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:justify-end sm:gap-6">
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-mauve">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-mauve">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

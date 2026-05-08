import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Heart, Menu, X } from "lucide-react";

const navLinks = [
  { name: "HOME", path: "/" },
  { name: "ABOUT US", path: "/about" },
  { name: "VENUES", path: "/venues" },
  { name: "SERVICES", path: "/services" },
  { name: "CONTACT US", path: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose to-gold shadow-lg shadow-rose/20 sm:h-12 sm:w-12">
              <Heart className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="text-center">
              <span
                className={`text-2xl font-script tracking-wide sm:text-3xl ${
                  scrolled ? "text-mauve-dark" : "text-white"
                }`}
              >
                Elegance
              </span>
              <span
                className={`block text-[9px] tracking-[0.22em] uppercase sm:text-[10px] sm:tracking-[0.3em] ${
                  scrolled ? "text-muted-foreground" : "text-white/80"
                }`}
              >
                weddings & celebrations
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-xs font-medium tracking-wider transition-colors ${
                  location.pathname === link.path
                    ? scrolled
                      ? "text-magenta"
                      : "text-white border-b-2 border-white"
                    : scrolled
                      ? "text-mauve-dark hover:text-magenta"
                      : "text-white/90 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center">
            <Link
              to="/auth"
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-colors ${
                scrolled
                  ? "bg-mauve-dark text-white hover:bg-magenta"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              LOGIN
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-mauve-dark" : "text-white"
            }`}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-white shadow-lg sm:max-h-[calc(100vh-5rem)]">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 text-sm font-medium tracking-wider transition-colors ${
                  location.pathname === link.path
                    ? "text-magenta bg-blush"
                    : "text-mauve-dark hover:text-magenta hover:bg-blush"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-border mt-2">
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-mauve-dark hover:text-magenta hover:bg-blush"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

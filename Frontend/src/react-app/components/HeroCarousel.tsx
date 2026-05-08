import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/react-app/data/content";

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <section className="relative min-h-[640px] w-full overflow-hidden sm:min-h-[720px] md:h-screen">
      {/* Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Content */}
          <div className="relative flex h-full items-center justify-center">
            <div
              className={`mx-auto max-w-4xl px-4 text-center transition-all duration-700 sm:px-6 ${
                index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="rounded-lg bg-white/20 px-5 py-5 backdrop-blur-sm sm:px-10 sm:py-8 lg:px-16 lg:py-10">
                <p className="mb-2 text-base text-white/90 sm:text-lg lg:text-xl">{slide.title}</p>
                <h1 className="text-3xl font-script text-white sm:text-5xl lg:text-6xl">
                  {slide.highlight}
                </h1>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:flex md:left-4 md:h-12 md:w-12"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:flex md:right-4 md:h-12 md:w-12"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-8">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

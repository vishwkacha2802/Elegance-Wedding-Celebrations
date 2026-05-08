// import { Link } from "react-router";
// import { ArrowRight, Star, Quote } from "lucide-react";
// import { Button } from "@/react-app/components/ui/button";
// import { Card, CardContent } from "@/react-app/components/ui/card";
// import Navbar from "@/react-app/components/Navbar";
// import Footer from "@/react-app/components/Footer";

// const allTestimonials = [
//   {
//     id: 1,
//     couple: "Jennifer & Robert",
//     location: "Garden Estate Wedding",
//     date: "October 2023",
//     quote:
//       "They transformed our vision into a fairytale. Every detail was perfect, from the floral arrangements to the lighting. Our guests are still talking about how magical the evening was!",
//     image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80",
//     story:
//       "Jennifer and Robert dreamed of an enchanted garden celebration. We transformed the estate into a wonderland with cascading florals and twinkling lights.",
//   },
//   {
//     id: 2,
//     couple: "Ananya & Vikram",
//     location: "Traditional Celebration",
//     date: "November 2023",
//     quote:
//       "Planning a wedding across cultures seemed daunting, but the team handled everything with such grace. They honored our traditions while adding creative touches that made our celebration truly unique.",
//     image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80",
//     story:
//       "A beautiful fusion of traditions—from the Haldi ceremony to the reception, every ritual was honored with authenticity and elegance.",
//   },
//   {
//     id: 3,
//     couple: "Michelle & Thomas",
//     location: "Beachside Destination Wedding",
//     date: "September 2023",
//     quote:
//       "Our destination wedding was flawless. The attention to detail and coordination was impeccable. We could truly relax and enjoy every moment knowing everything was in capable hands.",
//     image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400&q=80",
//     story:
//       "A sunset ceremony on the beach, followed by a reception under the stars. Every element was designed to capture the romance of the location.",
//   },
//   {
//     id: 4,
//     couple: "Emily & James",
//     location: "Vineyard Celebration",
//     date: "August 2023",
//     quote:
//       "From the first consultation to the last dance, the experience was nothing short of extraordinary. They understood our vision and exceeded every expectation.",
//     image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80",
//     story:
//       "Rolling hills, rustic elegance, and a celebration that felt like a dream. The vineyard setting was complemented by romantic details throughout.",
//   },
//   {
//     id: 5,
//     couple: "Priya & Arjun",
//     location: "Palace Wedding",
//     date: "December 2023",
//     quote:
//       "They managed our three-day celebration with incredible precision. The Mehendi, Sangeet, and wedding day were each uniquely beautiful yet cohesive in style.",
//     image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&q=80",
//     story:
//       "A grand celebration spanning three days, featuring traditional ceremonies, vibrant performances, and a reception fit for royalty.",
//   },
//   {
//     id: 6,
//     couple: "Sarah & Michael",
//     location: "Modern City Wedding",
//     date: "July 2023",
//     quote:
//       "We wanted something modern and sophisticated, and they delivered beyond our dreams. The rooftop ceremony with the city skyline was breathtaking.",
//     image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80",
//     story:
//       "Sleek, contemporary, and utterly romantic. The urban setting was transformed into an intimate celebration of modern love.",
//   },
// ];

// const badges = [
//   { name: "Top Rated on WeddingWire", rating: "4.9/5" },
//   { name: "Google Reviews", rating: "5.0/5" },
//   { name: "The Knot Best of Weddings", year: "2024" },
// ];

// export default function TestimonialsPage() {
//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />

//       {/* Hero */}
//       <section
//         className="relative h-[60vh] flex items-center justify-center"
//         style={{
//           backgroundImage:
//             "url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80)",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//         }}
//       >
//         <div className="absolute inset-0 bg-black/40" />
//         <div className="relative text-center px-4">
//           <p className="text-white/80 tracking-wider uppercase text-sm mb-3">Client Love</p>
//           <h1 className="text-4xl sm:text-5xl lg:text-6xl font-script text-white">Sweet Words</h1>
//         </div>
//       </section>

//       {/* Badges */}
//       <section className="py-12 bg-cream">
//         <div className="max-w-4xl mx-auto px-4">
//           <div className="flex flex-wrap justify-center gap-8">
//             {badges.map((badge) => (
//               <div key={badge.name} className="text-center">
//                 <div className="flex gap-1 justify-center mb-2">
//                   {[...Array(5)].map((_, i) => (
//                     <Star key={i} className="w-4 h-4 text-mauve fill-mauve" />
//                   ))}
//                 </div>
//                 <div className="font-semibold text-foreground">
//                   {badge.rating || badge.year}
//                 </div>
//                 <div className="text-sm text-muted-foreground">{badge.name}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Testimonials Grid */}
//       <section className="py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
//               Love Stories
//             </p>
//             <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-foreground">
//               What Our Couples Say
//             </h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             {allTestimonials.map((testimonial) => (
//               <Card key={testimonial.id} className="border-none shadow-lg overflow-hidden">
//                 <CardContent className="p-0">
//                   <div className="grid grid-cols-1 sm:grid-cols-3">
//                     <div className="aspect-square sm:aspect-auto overflow-hidden">
//                       <img
//                         src={testimonial.image}
//                         alt={testimonial.couple}
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                     <div className="sm:col-span-2 p-6">
//                       <Quote className="w-8 h-8 text-mauve/30 mb-4" />
//                       <p className="text-foreground italic mb-4 leading-relaxed">
//                         "{testimonial.quote}"
//                       </p>
//                       <div className="flex gap-1 mb-3">
//                         {[...Array(5)].map((_, i) => (
//                           <Star key={i} className="w-4 h-4 text-mauve fill-mauve" />
//                         ))}
//                       </div>
//                       <div className="font-semibold text-foreground">{testimonial.couple}</div>
//                       <div className="text-sm text-muted-foreground">
//                         {testimonial.location} • {testimonial.date}
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Video Testimonials Section */}
//       <section className="py-20 bg-blush">
//         <div className="max-w-4xl mx-auto px-4 text-center">
//           <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
//             Watch & Listen
//           </p>
//           <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
//             Stories from the Heart
//           </h2>
//           <p className="text-muted-foreground mb-8">
//             Hear directly from our couples about their wedding planning journey and their special
//             day.
//           </p>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {allTestimonials.slice(0, 3).map((testimonial) => (
//               <div
//                 key={testimonial.id}
//                 className="relative aspect-video rounded-lg overflow-hidden group"
//               >
//                 <img
//                   src={testimonial.image}
//                   alt={testimonial.couple}
//                   className="w-full h-full object-cover"
//                 />
//                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
//                   <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
//                     <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-magenta border-b-8 border-b-transparent ml-1" />
//                   </div>
//                 </div>
//                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
//                   <div className="text-white font-medium">{testimonial.couple}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="py-20">
//         <div className="max-w-4xl mx-auto px-4 text-center">
//           <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
//             Ready to Write Your Story?
//           </h2>
//           <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
//             We'd love to be part of your love story. Let's create something beautiful together.
//           </p>
//           <Link to="/contact">
//             <Button className="bg-magenta hover:bg-magenta/90 text-white">
//               Get in Touch
//               <ArrowRight className="w-4 h-4 ml-2" />
//             </Button>
//           </Link>
//         </div>
//       </section>

//       <Footer />
//     </div>
//   );
// }

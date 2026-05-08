// import { Link } from "react-router";
// import { ArrowRight, MessageSquare, Palette, ClipboardList, PartyPopper } from "lucide-react";
// import { Button } from "@/react-app/components/ui/button";
// import Navbar from "@/react-app/components/Navbar";
// import Footer from "@/react-app/components/Footer";

// const processDetails = [
//   {
//     step: 1,
//     icon: MessageSquare,
//     title: "Discovery & Consultation",
//     description:
//       "Every beautiful wedding begins with a conversation. In our initial consultation, we take the time to learn about you as a couple—your love story, your style, your dreams, and your vision for the big day.",
//     details: [
//       "In-depth questionnaire about your preferences",
//       "Budget discussion and planning",
//       "Timeline establishment",
//       "Initial concept brainstorming",
//     ],
//     image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
//   },
//   {
//     step: 2,
//     icon: ClipboardList,
//     title: "Planning & Curation",
//     description:
//       "With your vision in mind, our team gets to work creating a comprehensive plan. We curate the perfect vendors, venues, and experiences that align with your unique style.",
//     details: [
//       "Vendor research and recommendations",
//       "Venue scouting and booking",
//       "Timeline and schedule creation",
//       "Contract negotiations",
//     ],
//     image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
//   },
//   {
//     step: 3,
//     icon: Palette,
//     title: "Design & Creation",
//     description:
//       "This is where the magic truly happens. Our design team brings your vision to life with mood boards, color palettes, floral concepts, and detailed décor plans.",
//     details: [
//       "Custom mood boards and style guides",
//       "Floral and décor design",
//       "Stationery and invitation design",
//       "Lighting and ambiance planning",
//     ],
//     image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80",
//   },
//   {
//     step: 4,
//     icon: PartyPopper,
//     title: "Execution & Celebration",
//     description:
//       "On your wedding day, you should be fully present in every magical moment. Our team handles all the logistics, coordination, and problem-solving behind the scenes.",
//     details: [
//       "Day-of coordination and management",
//       "Vendor liaison and oversight",
//       "Timeline management",
//       "Emergency backup planning",
//     ],
//     image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
//   },
// ];

// export default function ProcessPage() {
//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />

//       {/* Hero */}
//       <section
//         className="relative h-[60vh] flex items-center justify-center"
//         style={{
//           backgroundImage:
//             "url(https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1920&q=80)",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//         }}
//       >
//         <div className="absolute inset-0 bg-black/40" />
//         <div className="relative text-center px-4">
//           <p className="text-white/80 tracking-wider uppercase text-sm mb-3">How We Work</p>
//           <h1 className="text-4xl sm:text-5xl lg:text-6xl font-script text-white">Our Process</h1>
//         </div>
//       </section>

//       {/* Introduction */}
//       <section className="py-16 bg-cream">
//         <div className="max-w-4xl mx-auto px-4 text-center">
//           <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
//             From Vision to Reality
//           </p>
//           <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
//             A Seamless Journey to Your Perfect Day
//           </h2>
//           <p className="text-muted-foreground leading-relaxed">
//             Planning a wedding can feel overwhelming, but it doesn't have to be. Our proven process
//             ensures that every detail is handled with care, creativity, and precision—so you can
//             enjoy the journey as much as the destination.
//           </p>
//         </div>
//       </section>

//       {/* Process Steps */}
//       <section className="py-20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           {processDetails.map((item, index) => (
//             <div
//               key={item.step}
//               className={`flex flex-col lg:flex-row gap-12 items-center mb-24 last:mb-0 ${
//                 index % 2 === 1 ? "lg:flex-row-reverse" : ""
//               }`}
//             >
//               <div className="flex-1">
//                 <div className="flex items-center gap-4 mb-6">
//                   <div className="w-16 h-16 rounded-full bg-mauve text-white flex items-center justify-center">
//                     <item.icon className="w-8 h-8" />
//                   </div>
//                   <div>
//                     <span className="text-mauve text-sm font-medium tracking-wider uppercase">
//                       Step {item.step}
//                     </span>
//                     <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
//                   </div>
//                 </div>

//                 <p className="text-muted-foreground mb-6 leading-relaxed">{item.description}</p>

//                 <ul className="space-y-3">
//                   {item.details.map((detail) => (
//                     <li key={detail} className="flex items-center gap-3">
//                       <div className="w-2 h-2 rounded-full bg-mauve" />
//                       <span className="text-muted-foreground">{detail}</span>
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               <div className="flex-1">
//                 <img
//                   src={item.image}
//                   alt={item.title}
//                   className="rounded-lg shadow-xl w-full"
//                 />
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* CTA */}
//       <section
//         className="py-24 relative"
//         style={{
//           backgroundImage:
//             "url(https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1920&q=80)",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundAttachment: "fixed",
//         }}
//       >
//         <div className="absolute inset-0 bg-black/50" />
//         <div className="relative max-w-4xl mx-auto px-4 text-center">
//           <h2 className="text-3xl sm:text-4xl lg:text-5xl font-script text-white mb-6">
//             Ready to Begin Your Journey?
//           </h2>
//           <p className="text-white/80 mb-8 text-lg max-w-2xl mx-auto">
//             Let's start with a conversation. Tell us about your vision, and let's create something
//             beautiful together.
//           </p>
//           <Link to="/contact">
//             <Button size="lg" className="bg-magenta hover:bg-magenta/90 text-white px-8">
//               Schedule a Consultation
//               <ArrowRight className="w-4 h-4 ml-2" />
//             </Button>
//           </Link>
//         </div>
//       </section>

//       <Footer />
//     </div>
//   );
// }

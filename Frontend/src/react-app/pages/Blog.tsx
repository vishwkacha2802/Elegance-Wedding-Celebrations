// import { Link } from "react-router";
// import { ArrowRight, Calendar, Tag } from "lucide-react";
// import { Button } from "@/react-app/components/ui/button";
// import { Card, CardContent } from "@/react-app/components/ui/card";
// import { Badge } from "@/react-app/components/ui/badge";
// import Navbar from "@/react-app/components/Navbar";
// import Footer from "@/react-app/components/Footer";

// const blogPosts = [
//   {
//     id: 1,
//     title: "10 Trending Wedding Themes for 2024",
//     excerpt:
//       "Discover the most sought-after wedding aesthetics this year, from romantic garden parties to modern minimalism. Learn how to incorporate these trends into your special day.",
//     image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
//     date: "March 15, 2024",
//     category: "Trends",
//     readTime: "5 min read",
//   },
//   {
//     id: 2,
//     title: "Planning Your Perfect Mehendi Ceremony",
//     excerpt:
//       "Tips and ideas to make your mehendi celebration colorful, fun, and truly memorable. From décor to entertainment, we cover everything you need to know.",
//     image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80",
//     date: "March 10, 2024",
//     category: "Traditions",
//     readTime: "7 min read",
//   },
//   {
//     id: 3,
//     title: "How to Choose Your Wedding Venue",
//     excerpt:
//       "A comprehensive guide to finding the perfect location that matches your vision, style, and budget. Plus, questions to ask during venue tours.",
//     image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
//     date: "March 5, 2024",
//     category: "Planning",
//     readTime: "8 min read",
//   },
//   {
//     id: 4,
//     title: "Wedding Flower Guide: Seasonal Blooms",
//     excerpt:
//       "Learn which flowers are in season throughout the year and how to create stunning arrangements that fit your wedding theme and budget.",
//     image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80",
//     date: "February 28, 2024",
//     category: "Décor",
//     readTime: "6 min read",
//   },
//   {
//     id: 5,
//     title: "Creating a Wedding Day Timeline",
//     excerpt:
//       "A detailed guide to planning your wedding day schedule, ensuring everything runs smoothly from morning preparations to the last dance.",
//     image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80",
//     date: "February 20, 2024",
//     category: "Planning",
//     readTime: "10 min read",
//   },
//   {
//     id: 6,
//     title: "Destination Wedding: What to Consider",
//     excerpt:
//       "Dreaming of saying 'I do' in an exotic location? Here's everything you need to know about planning a destination wedding.",
//     image: "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800&q=80",
//     date: "February 15, 2024",
//     category: "Destination",
//     readTime: "9 min read",
//   },
// ];

// const categories = ["All", "Trends", "Planning", "Traditions", "Décor", "Destination"];

// export default function BlogPage() {
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
//           <p className="text-white/80 tracking-wider uppercase text-sm mb-3">Inspiration & Tips</p>
//           <h1 className="text-4xl sm:text-5xl lg:text-6xl font-script text-white">Our Blog</h1>
//         </div>
//       </section>

//       {/* Categories */}
//       <section className="py-8 bg-cream border-b border-border">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-wrap justify-center gap-3">
//             {categories.map((category) => (
//               <button
//                 key={category}
//                 className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
//                   category === "All"
//                     ? "bg-mauve text-white"
//                     : "bg-background text-muted-foreground hover:bg-mauve/10 hover:text-mauve"
//                 }`}
//               >
//                 {category}
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Featured Post */}
//       <section className="py-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <Card className="overflow-hidden border-none shadow-xl">
//             <div className="grid grid-cols-1 lg:grid-cols-2">
//               <div className="aspect-video lg:aspect-auto overflow-hidden">
//                 <img
//                   src={blogPosts[0].image}
//                   alt={blogPosts[0].title}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
//                 <Badge className="w-fit mb-4 bg-mauve/10 text-mauve hover:bg-mauve/20">
//                   Featured
//                 </Badge>
//                 <h2 className="text-2xl lg:text-3xl font-semibold text-foreground mb-4">
//                   {blogPosts[0].title}
//                 </h2>
//                 <p className="text-muted-foreground mb-6">{blogPosts[0].excerpt}</p>
//                 <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
//                   <span className="flex items-center gap-1">
//                     <Calendar className="w-4 h-4" />
//                     {blogPosts[0].date}
//                   </span>
//                   <span className="flex items-center gap-1">
//                     <Tag className="w-4 h-4" />
//                     {blogPosts[0].category}
//                   </span>
//                   <span>{blogPosts[0].readTime}</span>
//                 </div>
//                 <Button className="w-fit bg-magenta hover:bg-magenta/90 text-white">
//                   Read Article
//                   <ArrowRight className="w-4 h-4 ml-2" />
//                 </Button>
//               </CardContent>
//             </div>
//           </Card>
//         </div>
//       </section>

//       {/* Blog Grid */}
//       <section className="py-16 bg-cream">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
//               Latest Articles
//             </p>
//             <h2 className="text-3xl sm:text-4xl font-script text-foreground">
//               Wedding Planning Insights
//             </h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {blogPosts.slice(1).map((post) => (
//               <Card
//                 key={post.id}
//                 className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow group"
//               >
//                 <div className="aspect-video overflow-hidden">
//                   <img
//                     src={post.image}
//                     alt={post.title}
//                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
//                   />
//                 </div>
//                 <CardContent className="p-6">
//                   <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
//                     <Badge variant="secondary" className="bg-mauve/10 text-mauve hover:bg-mauve/20">
//                       {post.category}
//                     </Badge>
//                     <span>{post.readTime}</span>
//                   </div>
//                   <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-mauve transition-colors">
//                     {post.title}
//                   </h3>
//                   <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-muted-foreground flex items-center gap-1">
//                       <Calendar className="w-4 h-4" />
//                       {post.date}
//                     </span>
//                     <button className="text-mauve text-sm font-medium hover:text-magenta transition-colors flex items-center gap-1">
//                       Read More
//                       <ArrowRight className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           <div className="text-center mt-12">
//             <Button variant="outline" className="border-mauve text-mauve hover:bg-mauve hover:text-white">
//               Load More Articles
//               <ArrowRight className="w-4 h-4 ml-2" />
//             </Button>
//           </div>
//         </div>
//       </section>

//       {/* Newsletter */}
//       <section className="py-20">
//         <div className="max-w-4xl mx-auto px-4 text-center">
//           <p className="text-mauve font-medium tracking-wider uppercase text-sm mb-3">
//             Stay Inspired
//           </p>
//           <h2 className="text-3xl sm:text-4xl font-script text-foreground mb-6">
//             Subscribe to Our Newsletter
//           </h2>
//           <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
//             Get the latest wedding trends, planning tips, and inspiration delivered straight to your
//             inbox.
//           </p>
//           <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
//             <input
//               type="email"
//               placeholder="Enter your email"
//               className="flex-1 px-4 py-3 rounded-lg border border-border focus:outline-none focus:border-mauve"
//             />
//             <Button className="bg-magenta hover:bg-magenta/90 text-white px-8">Subscribe</Button>
//           </form>
//         </div>
//       </section>

//       <Footer />
//     </div>
//   );
// }

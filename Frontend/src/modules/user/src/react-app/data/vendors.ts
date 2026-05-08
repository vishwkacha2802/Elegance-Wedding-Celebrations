export interface Vendor {
  id: number;
  name: string;
  service: string;
  price: number;
  rating: number;
  location: string;
  image: string;
  description: string;
  portfolio: string[];
  reviews: Review[];
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  features: string[];
  availability: string;
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  date: string;
  comment: string;
  avatar?: string;
}

export const SERVICES = [
  { id: "venue", label: "Venue", color: "text-rose" },
  { id: "catering", label: "Catering", color: "text-gold" },
  { id: "photography", label: "Photography", color: "text-mauve" },
  { id: "decoration", label: "Decoration", color: "text-magenta" },
  { id: "makeup", label: "Makeup & Styling", color: "text-gold" },
  { id: "music", label: "Music & DJ", color: "text-mauve-dark" },
  { id: "flowers", label: "Flowers", color: "text-rose" },
  { id: "transportation", label: "Transportation", color: "text-muted-foreground" },
  { id: "cake", label: "Wedding Cake", color: "text-magenta" },
];

export const VENDORS: Vendor[] = [
  {
    id: 1,
    name: "Royal Gardens Venue",
    service: "venue",
    price: 15000,
    rating: 4.9,
    location: "Downtown",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    description: "An enchanting garden venue featuring manicured lawns, elegant fountains, and a stunning glass conservatory. Perfect for ceremonies up to 300 guests with both indoor and outdoor spaces available.",
    portfolio: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600",
      "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600",
      "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600"
    ],
    reviews: [
      { id: 1, author: "Binal & Meet", rating: 5, date: "2025-03-15", comment: "Absolutely magical! The gardens were breathtaking and the staff made our day perfect." },
      { id: 2, author: "Shakshi & Heet", rating: 5, date: "2025-02-20", comment: "Could not have asked for a more beautiful venue. Our guests are still talking about it!" },
      { id: 3, author: "Pooja & Ankur", rating: 4, date: "2025-01-10", comment: "Beautiful space with excellent catering options. The coordinator was very helpful." }
    ],
    contact: { phone: "(555) 123-4567", email: "events@royalgardens.com", website: "www.royalgardens.com" },
    features: ["Indoor & Outdoor Spaces", "On-site Catering", "Bridal Suite", "Free Parking", "AV Equipment", "Wedding Coordinator"],
    availability: "Weekends booking fast for 2025"
  },
  {
    id: 2,
    name: "Gourmet Delights Catering",
    service: "catering",
    price: 8000,
    rating: 4.8,
    location: "City Center",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
    description: "Award-winning catering service specializing in farm-to-table cuisine. We craft personalized menus that reflect your unique taste and dietary preferences.",
    portfolio: [
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=600",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600"
    ],
    reviews: [
      { id: 1, author: "Dipen & Anamika", rating: 5, date: "2025-03-01", comment: "The food was incredible! Every guest complimented the menu. Worth every penny." },
      { id: 2, author: "Amanda & Chris", rating: 5, date: "2025-02-14", comment: "They accommodated all our dietary restrictions flawlessly. Amazing service!" }
    ],
    contact: { phone: "(555) 234-5678", email: "weddings@gourmetdelights.com", website: "www.gourmetdelights.com" },
    features: ["Custom Menus", "Dietary Accommodations", "Tastings Included", "Full Service Staff", "Bar Service", "Elegant Presentation"],
    availability: "Limited dates in Fall 2025"
  },
  {
    id: 3,
    name: "Lens & Light Photography",
    service: "photography",
    price: 5000,
    rating: 4.9,
    location: "Metro Area",
    image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800",
    description: "Capturing your love story through timeless, editorial-style photography. Our team of award-winning photographers specializes in candid moments and stunning portraits.",
    portfolio: [
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=600",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600"
    ],
    reviews: [
      { id: 1, author: "Rachel & Mark", rating: 5, date: "2024-03-20", comment: "Our photos are absolutely stunning! They captured every emotion perfectly." },
      { id: 2, author: "Nicole & Steve", rating: 5, date: "2024-02-28", comment: "Professional, creative, and so easy to work with. Highly recommend!" }
    ],
    contact: { phone: "(555) 345-6789", email: "hello@lensandlight.com", website: "www.lensandlight.com" },
    features: ["8+ Hours Coverage", "Second Photographer", "Engagement Session", "Online Gallery", "Print Rights", "Same-Day Previews"],
    availability: "Booking 12+ months in advance"
  },
  {
    id: 4,
    name: "Bloom & Blossom Decorators",
    service: "decoration",
    price: 6000,
    rating: 4.7,
    location: "All Areas",
    image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800",
    description: "Transform your venue into a fairy tale setting. We specialize in romantic, elegant designs using premium florals, lighting, and custom installations.",
    portfolio: [
      "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600",
      "https://images.unsplash.com/photo-1507504031003-b417f6d5bf6b?w=600",
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600"
    ],
    reviews: [
      { id: 1, author: "Kate & Andrew", rating: 5, date: "2024-03-10", comment: "They turned our venue into something out of a magazine. Absolutely magical!" },
      { id: 2, author: "Megan & Josh", rating: 4, date: "2024-02-05", comment: "Beautiful work and very professional. The arch they created was stunning." }
    ],
    contact: { phone: "(555) 456-7890", email: "design@bloomblossom.com" },
    features: ["Custom Designs", "Ceremony & Reception", "Lighting Design", "Draping", "Centerpieces", "Setup & Breakdown"],
    availability: "Currently accepting 2025 bookings"
  },
  {
    id: 5,
    name: "Glamour Studio",
    service: "makeup",
    price: 2500,
    rating: 4.8,
    location: "Uptown",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800",
    description: "Look and feel your absolute best on your special day. Our team of celebrity makeup artists and hairstylists create flawless, long-lasting bridal looks.",
    portfolio: [
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600"
    ],
    reviews: [
      { id: 1, author: "Ashley", rating: 5, date: "2024-03-18", comment: "I felt like a princess! My makeup lasted all day and night, even through happy tears." },
      { id: 2, author: "Victoria", rating: 5, date: "2024-02-25", comment: "The trial was so helpful and the day-of was stress-free. Love my look!" }
    ],
    contact: { phone: "(555) 567-8901", email: "bridal@glamourstudio.com", website: "www.glamourstudio.com" },
    features: ["Bridal Trial", "On-location Service", "Airbrush Makeup", "Hair Styling", "Bridesmaids Available", "Touch-up Kit"],
    availability: "Book 3+ months ahead"
  },
  {
    id: 6,
    name: "Beats & Rhythms DJ",
    service: "music",
    price: 3000,
    rating: 4.6,
    location: "City Wide",
    image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800",
    description: "Keep your guests dancing all night! We blend the perfect mix of classics and current hits, reading the room to create an unforgettable party atmosphere.",
    portfolio: [
      "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600"
    ],
    reviews: [
      { id: 1, author: "Stephanie & Ryan", rating: 5, date: "2024-03-05", comment: "The dance floor was packed all night! He knew exactly what to play and when." },
      { id: 2, author: "Lauren & Mike", rating: 4, date: "2024-02-10", comment: "Great energy and professional setup. Our reception was a blast!" }
    ],
    contact: { phone: "(555) 678-9012", email: "book@beatsrhythms.com", website: "www.beatsrhythms.com" },
    features: ["6+ Hours", "MC Services", "Premium Sound System", "Dance Lighting", "Song Requests", "Wireless Microphones"],
    availability: "Prime dates filling up"
  },
  {
    id: 7,
    name: "Petal Perfect Flowers",
    service: "flowers",
    price: 3500,
    rating: 4.9,
    location: "All Areas",
    image: "https://images.unsplash.com/photo-1561128290-005a1f7a0f6c?w=800",
    description: "Artisanal floral designs that bring your vision to life. From romantic garden style to modern minimalist, we create stunning arrangements for your entire wedding.",
    portfolio: [
      "https://images.unsplash.com/photo-1561128290-005a1f7a0f6c?w=600",
      "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600",
      "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=600",
      "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600"
    ],
    reviews: [
      { id: 1, author: "Hannah & Ben", rating: 5, date: "2024-03-12", comment: "My bouquet was even more beautiful than I imagined! Every detail was perfect." },
      { id: 2, author: "Olivia & Nathan", rating: 5, date: "2024-02-18", comment: "They really listened to our vision and exceeded our expectations." }
    ],
    contact: { phone: "(555) 789-0123", email: "flowers@petalperfect.com", website: "www.petalperfect.com" },
    features: ["Bridal Bouquet", "Bridesmaids Bouquets", "Boutonnieres", "Ceremony Flowers", "Reception Centerpieces", "Delivery & Setup"],
    availability: "Accepting all 2025 dates"
  },
  {
    id: 8,
    name: "Sweet Celebrations Bakery",
    service: "cake",
    price: 1500,
    rating: 4.8,
    location: "Downtown",
    image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800",
    description: "Handcrafted wedding cakes that taste as amazing as they look. From classic elegance to modern masterpieces, each cake is a work of art made with premium ingredients.",
    portfolio: [
      "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600",
      "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=600",
      "https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=600",
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600"
    ],
    reviews: [
      { id: 1, author: "Christina & Tyler", rating: 5, date: "2024-03-08", comment: "The most delicious cake we've ever had! Guests kept asking for seconds." },
      { id: 2, author: "Emily & Jason", rating: 5, date: "2024-02-22", comment: "Beautiful design and incredible flavors. The tasting was such a fun experience!" }
    ],
    contact: { phone: "(555) 890-1234", email: "orders@sweetcelebrations.com", website: "www.sweetcelebrations.com" },
    features: ["Custom Design", "Cake Tasting", "Delivery & Setup", "Cutting Set Rental", "Dessert Table Options", "Dietary Options"],
    availability: "Order 2+ months in advance"
  },
  {
    id: 9,
    name: "Elite Wedding Transport",
    service: "transportation",
    price: 2000,
    rating: 4.7,
    location: "Metro Area",
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800",
    description: "Arrive in style with our luxury fleet of vintage cars, limousines, and modern luxury vehicles. Professional chauffeurs ensure a smooth, memorable ride.",
    portfolio: [
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=600"
    ],
    reviews: [
      { id: 1, author: "Diana & Robert", rating: 5, date: "2024-03-02", comment: "The vintage Rolls Royce was stunning! Our chauffeur was so professional." },
      { id: 2, author: "Michelle & Kevin", rating: 4, date: "2024-02-15", comment: "Great service and the car looked amazing in our photos." }
    ],
    contact: { phone: "(555) 901-2345", email: "book@eliteweddingtransport.com", website: "www.eliteweddingtransport.com" },
    features: ["Vintage & Modern Fleet", "Professional Chauffeurs", "Red Carpet Service", "Champagne Toast", "Photo Ops", "Guest Shuttles Available"],
    availability: "Book 1+ month ahead"
  }
];

export function getVendorById(id: number): Vendor | undefined {
  return VENDORS.find(v => v.id === id);
}

export function getServiceLabel(serviceId: string): string {
  return SERVICES.find(s => s.id === serviceId)?.label || serviceId;
}

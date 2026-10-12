/** Central site identity and confirmed location, giving, and service details. */
export const siteConfig = {
  /** Canonical display name. Used by the navbar, footer, headings and metadata. */
  brandName: "Glorious Restoration Embassy",
  /** Short form for tight spaces. */
  brandShort: "GRE",
  /** Canonical origin — used by metadataBase and the sitemap so they agree. */
  url: "https://gloriousrestorationembassy.org",
  tagline:
    "A place of weightless faith, boundless grace, and immersive spiritual depth.",

  // Existing contact channels are kept separate from the confirmed service and giving details.
  email: "embassychurchglory@gmail.com",
  phone: "+254721356430",
  phoneDisplay: "+254721356430",
  /** Digits only, for wa.me links. */
  whatsapp: "254721356430",

  // Broadcast channels
  facebookLive: "https://www.facebook.com/share/1Xob4wuJwK/",
  facebook: "https://www.facebook.com/share/1Xob4wuJwK/",
  instagram: "",
  youtube: "https://www.youtube.com/@stephenkariuki7444",

  // Confirmed M-Pesa giving details
  giveChannel: {
    label: "M-Pesa Paybill",
    paybill: "247247",
    account: "267912",
    accountName: "GLORY EMBASSY OF GRACE CHURCH"
  },

  headquarters: {
    name: "Joska, Machakos County",
    coordinates: "1.28617° S, 37.08908° E",
    mapsUrl: "https://www.google.com/maps?q=-1.28617,37.08908"
  },

  /** Verified weekly service schedule. */
  serviceTimes: [
    { day: "Sunday", time: "8:30 AM", label: "First Glory" },
    { day: "Sunday", time: "10:45 AM", label: "Divine Restoration" },
    { day: "Tuesday", time: "11:00 AM", label: "Deliverance" },
    { day: "Wednesday", time: "6:00 PM", label: "Word Clinic" }
  ],

  /** IANA timezone used for "next service" calculations. */
  timeZone: "Africa/Nairobi"
} as const;
export const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Ministries", href: "/ministries" },
  { label: "Sermons", href: "/sermons" },
  { label: "Events", href: "/events" },
  { label: "Watch Live", href: "/livestream" },
  // "Give" is deliberately absent here: the navbar renders a dedicated Give
  // button (and the mobile menu a "Give Online" button), so listing it again
  // as a text link printed the word "Give" twice in a row.
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" }
];

export const heroContent = {
  title: "Welcome Home",
  subtitle: "Join us every Sunday as we worship God, grow in His Word, and build a Christ-centered community where everyone belongs.",
  ctaPrimary: "Plan Your Visit",
  ctaSecondary: "Our Ministries"
};

export const ministries = [
  {
    title: "Community Outreach",
    description: "Reaching out to our local community with the love and hands of Christ through food drives, medical camps, and evangelism.",
    icon: "HeartHandshake"
  },
  {
    title: "Youth Ministry",
    description: "Discipleship, mentoring, and community building for the next generation with dynamic worship and leadership training.",
    icon: "Sparkles"
  },
  {
    title: "Retreats",
    description: "Spiritual retreats to unplug, reflect, and grow closer to God in serene environments.",
    icon: "Mountain"
  },
  {
    title: "Worship & Arts",
    description: "Creative expression through music, dance, and drama to glorify God and inspire the congregation.",
    icon: "Music"
  },
  {
    title: "Children's Ministry",
    description: "Nurturing young hearts with biblical teachings, fun activities, and godly values.",
    icon: "BookOpen"
  },
  {
    title: "Prayer & Intercession",
    description: "Dedicated prayer warriors standing in the gap for the church, nation, and personal needs.",
    icon: "HeartPulse"
  }
];

export const sermons = [];

export type SiteEvent = {
  title: string;
  date: string;
  venue: string;
  description: string;
  badge: string;
  image?: string;
};
export const events: SiteEvent[] = [];

export const galleryItems = [
  { title: "Worship Night", image: "/gallery/photo12.jpeg" },
  { title: "Community Fellowship", image: "/gallery/photo19.jpeg" },
  { title: "Outreach Ministry", image: "/gallery/photo21.jpeg" },
  { title: "Sunday Service", image: "/gallery/photo26.jpeg" },
  { title: "Youth Gathering", image: "/gallery/photo31.jpeg" },
  { title: "Prayer Meeting", image: "/gallery/photo33.jpeg" },
  { title: "Choir Ministration", image: "/gallery/photo16.jpeg" },
  { title: "Church Family", image: "/gallery/photo23.jpeg" },
  { title: "Baptism Service", image: "/gallery/photo1.jpg" },
  { title: "Children's Sunday School", image: "/gallery/photo10.jpeg" },
  { title: "Church Conference", image: "/gallery/photo2.jpg" },
  { title: "Couples Ministry", image: "/gallery/photo14.jpeg" }
];

export const donationInfo = {
  title: "Give",
  description: "Secure online giving for tithes, offerings, missions, and our building fund.",
  cta: "Give now"
};
export const branches = [
  {
    city: "Joska, Machakos County",
    kind: "Headquarters",
    address: "Joska, Machakos County",
    coordinates: siteConfig.headquarters.coordinates,
    mapsUrl: siteConfig.headquarters.mapsUrl
  },
  {
    city: "Murang'a",
    kind: "Mother Church",
    address: "Murang'a",
    coordinates: null,
    mapsUrl: null
  }
];

// Search index for search widget
export const searchIndex = [
  {
    title: "Welcome Home",
    description: "Home page of Glorious Restoration Embassy - A place of weightless faith, boundless grace, and immersive spiritual depth.",
    href: "/",
    category: "page"
  },
  {
    title: "About Us",
    description: "Learn about our mission, vision, and church history.",
    href: "/about",
    category: "page"
  },
  {
    title: "Our Ministries",
    description: "Explore our various ministries including Youth, Worship, Outreach, and more.",
    href: "/ministries",
    category: "page"
  },
  {
    title: "Sermons Archive",
    description: "Listen to past sermons and teachings from our pastors.",
    href: "/sermons",
    category: "page"
  },
  {
    title: "Upcoming Events",
    description: "Stay updated with our church events, conferences, and special services.",
    href: "/events",
    category: "page"
  },
  {
    title: "Watch Live",
    description: "Join our live services and events online.",
    href: "/livestream",
    category: "page"
  },
  {
    title: "Gallery",
    description: "View photos from our events, services, and community activities.",
    href: "/gallery",
    category: "page"
  },
  {
    title: "News & Daily Scripture",
    description: "Read selected headlines from Kenya and Africa, and a daily Bible verse.",
    href: "/news",
    category: "page"
  },
  {
    title: "Contact Us",
    description: "Get in touch with us for church enquiries or feedback.",
    href: "/contact",
    category: "page"
  },
  {
    title: "Give Online",
    description: "Support the ministry through secure online giving.",
    href: "/give",
    category: "page"
  }
];

export const pastor = {
  name: "Bishop David Omari",
  // TODO: Add actual pastor image to /public/pastor.jpg when available
  // Current fallback image from gallery
  image: "/gallery/photo24.jpeg",
  bio: "Bishop David Omari is the senior pastor and founder of Glorious Restoration Embassy. With over 20 years of ministry experience, he leads with a vision to restore hope, dignity, and purpose to God's people. His teaching is characterized by deep biblical insight, practical wisdom, and a heart for the lost.",
  title: "Senior Pastor & Founder",
  email: "bishop@gloriousrestorationembassy.org"
};

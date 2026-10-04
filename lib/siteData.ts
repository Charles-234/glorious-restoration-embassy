/**
 * Single source of truth for church identity, contact details and service times.
 *
 * Every component should read from `siteConfig` instead of hardcoding a name,
 * phone number or email, so those details can only ever disagree in ONE place.
 *
 * TODO(confirm with church office): the codebase previously carried three
 * conflicting sets of contact details (footer vs contact page vs branches) and
 * two different church names ("Glorious Restoration Embassy" vs "Glory Embassy
 * of Grace Church"). The values below are the most plausible set, centralised
 * here so they can be corrected with a single edit.
 */
export const siteConfig = {
  /** Canonical display name. Used by the navbar, footer, headings and metadata. */
  brandName: "Glorious Restoration Embassy",
  /** Short form for tight spaces. */
  brandShort: "GRE",
  /** Canonical origin — used by metadataBase and the sitemap so they agree. */
  url: "https://gloriousrestorationembassy.org",
  tagline:
    "A place of weightless faith, boundless grace, and immersive spiritual depth.",

  // TODO(confirm): contact details
  email: "embassychurchglory@gmail.com",
  phone: "+254726791236",
  phoneDisplay: "+254 726 791 236",
  /** Digits only, for wa.me links. */
  whatsapp: "254726791236",

  // TODO(confirm): broadcast channels
  facebookLive: "https://www.facebook.com/share/1Xob4wuJwK/",
  facebook: "https://www.facebook.com/share/1Xob4wuJwK/",
  instagram: "",
  youtube: "",

  // TODO(confirm): giving details (see /give)
  giveChannel: {
    label: "M-Pesa Paybill",
    paybill: "",
    account: "Giving"
  },

  /** Sunday order of service — used by the livestream widget. */
  serviceTimes: [
    { time: "8.00 AM - 10.00 AM", label: "Prayers and Bible study" },
    { time: "10.00 AM - 11.30 AM", label: "Worship and Praise" },
    { time: "11.30 AM - 1.00 PM", label: "Main Service" }
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

export const sermons = [
  {
    title: "A New Thing",
    speaker: "Pastor Steve Kariuki",
    date: "Jun 14, 2026",
    summary: "Reflecting on Isaiah 43:19 and God's promise to make a way in the wilderness and rivers in the desert."
  },
  {
    title: "The Power of Unity",
    speaker: "Bishop David Omari",
    date: "Jun 7, 2026",
    summary: "Understanding the biblical principle that when believers are united, God commands His blessing."
  },
  {
    title: "Breaking Generational Curses",
    speaker: "Pastor Steve Kariuki",
    date: "May 31, 2026",
    summary: "Learning how to identify and break negative patterns that have been passed down through generations."
  },
  {
    title: "The Purpose of Fasting",
    speaker: "Bishop David Omari",
    date: "May 24, 2026",
    summary: "Discovering the spiritual benefits and biblical foundations of fasting and prayer."
  }
];

export const events = [
  {
    title: "Ordination of Pastor Steve Kariuki to Apostleship",
    date: "August 15, 2026",
    description: "Join us for this special ordination service as we celebrate and commission Pastor Steve Kariuki into his new role as Apostle.",
    venue: "Grace Community Church Main Sanctuary",
    badge: "Ordination service"
  },
  {
    title: "Youth Camp 2026",
    date: "December 10-13, 2026",
    description: "Four days of intensive discipleship, worship, and fun activities for youth aged 13-25.",
    venue: "Karen Camp, Nairobi",
    badge: "Youth event"
  },
  {
    title: "Annual Thanksgiving Service",
    date: "November 29, 2026",
    description: "A special service to give thanks to God for His faithfulness throughout the year.",
    venue: "All branches",
    badge: "Special service"
  },
  {
    title: "Community Medical Camp",
    date: "September 20, 2026",
    description: "Free medical checkups, consultations, and treatment for the community.",
    venue: "Machakos Main Branch",
    badge: "Outreach"
  }
];

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
    city: "Nairobi",
    address: "123 Main Street, Nairobi, Kenya",
    phone: "+254 712 345 678"
  },
  {
    city: "Mombasa",
    address: "456 Beach Rd, Mombasa, Kenya",
    phone: "+254 733 123 456"
  },
  {
    city: "Machakos",
    address: "789 Town Square, Machakos, Kenya",
    phone: "+254 755 987 654"
  },
  {
    city: "Murang'a",
    address: "321 Church Road, Murang'a, Kenya",
    phone: "+254 777 123 456"
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
    title: "Contact Us",
    description: "Get in touch with us for prayer requests, inquiries, or feedback.",
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


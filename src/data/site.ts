// Structural copy that defines the brand's process. Business data (contact,
// services, projects, gallery, factory, testimonials) lives in Google Sheets.

export const BRAND = {
  headline: "Complete Interior Solutions, Designed for Your Space.",
  subheadline: "From 3D Design to Manufacturing and Installation — Complete Modular Interiors Under One Roof.",
  statement: "We don't just design interiors — we design, manufacture and install complete modular interiors.",
};

export const NAV_INTERIORS = [
  { label: "Interior Services", href: "/interiors" },
  { label: "Modular Kitchen", href: "/interiors/modular-kitchen" },
  { label: "Wardrobes", href: "/interiors/wardrobes" },
  { label: "Bedroom Interiors", href: "/interiors/bedroom-interiors" },
  { label: "Living Room Interiors", href: "/interiors/living-room" },
  { label: "TV Units", href: "/interiors/tv-units" },
  { label: "Pooja Units", href: "/interiors/pooja-units" },
  { label: "Office Interiors", href: "/interiors/office-interiors" },
  { label: "Full Home Interiors", href: "/interiors/full-home-interiors" },
  { label: "Commercial Interiors", href: "/interiors/commercial-interiors" },
];

export const NAV_MAIN = [
  { label: "Home", href: "/" },
  { label: "Interiors", href: "/interiors", children: NAV_INTERIORS },
  { label: "Projects", href: "/projects" },
  { label: "Gallery", href: "/gallery" },
  { label: "Factory", href: "/factory" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const TRUST_POINTS = [
  "Professional Interior Design",
  "In-house Modular Manufacturing",
  "Customised Designs",
  "Quality Materials",
  "Installation Support",
  "End-to-End Project Management",
];

export const DESIGN_SERVICES = [
  { title: "Space Planning", text: "Zoning and circulation that make every square foot useful." },
  { title: "2D Layout", text: "Measured furniture layouts and elevations for clarity before build." },
  { title: "3D Interior Design", text: "Realistic 3D views so you see the space before it is made." },
  { title: "Material Selection", text: "Boards, hardware and finishes matched to use and budget." },
  { title: "Colour Selection", text: "A cohesive palette across walls, furniture and fabrics." },
  { title: "Laminate Selection", text: "Guided selection from laminate, acrylic and PU catalogues." },
  { title: "Lighting Planning", text: "Ambient, task and accent lighting planned with the design." },
  { title: "Furniture Planning", text: "Built-in and loose furniture sized to the room." },
  { title: "Custom Design", text: "One-off pieces designed for your exact needs." },
];

export const MODULAR_SOLUTIONS = [
  "Modular Kitchen",
  "Wardrobes",
  "Bedroom Furniture",
  "TV Units",
  "Storage Units",
  "Loft Storage",
  "Pooja Units",
  "Study Units",
  "Home Office Furniture",
  "Utility Units",
  "Custom Modular Furniture",
];

export const DESIGN_ONLY_VS_COMPLETE = {
  designOnly: [
    "You receive drawings and 3D views",
    "You find and coordinate carpenters or vendors",
    "Quality depends on multiple contractors",
    "Design intent can be lost during execution",
    "Several points of contact and schedules",
  ],
  complete: [
    "Design, manufacturing and installation by one team",
    "Units made in our own factory to exact measurements",
    "Quality inspected before dispatch",
    "Design intent carried through to installation",
    "One point of contact and one coordinated schedule",
  ],
};

export const CUSTOMER_PROCESS = [
  "Consultation",
  "Site Visit",
  "Measurements",
  "2D Design",
  "3D Design",
  "Material Finalisation",
  "Quotation",
  "Design Approval",
  "Factory Manufacturing",
  "Quality Check",
  "Delivery",
  "Installation",
  "Final Handover",
];

export const WHY_CHOOSE_US = [
  { icon: "factory", title: "In-house Manufacturing", text: "Modular units produced in our own factory." },
  { icon: "pencil", title: "Custom Design", text: "Every design is made for your space and lifestyle." },
  { icon: "box", title: "Professional 3D Visualization", text: "See your interiors before production begins." },
  { icon: "layers", title: "Quality Material Selection", text: "Guided choice of boards, finishes and hardware." },
  { icon: "eye", title: "Transparent Process", text: "Clear stages, approvals and itemised quotations." },
  { icon: "wrench", title: "Skilled Installation Team", text: "Our own trained team installs what we make." },
  { icon: "calendar", title: "Project Coordination", text: "One coordinated schedule from design to handover." },
  { icon: "ruler", title: "Custom Measurements", text: "Built to precise site measurements." },
  { icon: "grid", title: "Modular Construction", text: "Factory-made modules for consistent quality." },
  { icon: "check", title: "End-to-End Service", text: "Design, manufacturing and installation in one place." },
];

export const LEAD_OPTIONS = {
  requirement: ["Full Home Interiors", "Modular Kitchen", "Bedroom", "Living Room", "Wardrobe", "Office", "Commercial", "Other"],
  propertyType: ["Apartment", "Villa", "Independent House", "Office", "Commercial", "Other"],
  propertyStatus: ["Planning", "Under Construction", "Ready to Move", "Renovation"],
  budget: ["Below ₹5 Lakhs", "₹5–10 Lakhs", "₹10–20 Lakhs", "₹20–30 Lakhs", "₹30 Lakhs+", "Not Decided"],
  preferredContact: ["WhatsApp", "Phone Call", "Email"],
};

export const GALLERY_CATEGORIES = [
  "All",
  "Kitchen",
  "Bedroom",
  "Living Room",
  "Wardrobe",
  "TV Unit",
  "Full Home",
  "Office",
  "Commercial",
  "Factory",
];

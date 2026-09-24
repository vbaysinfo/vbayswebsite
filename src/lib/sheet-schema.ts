// Single source of truth for the Google Sheets structure.
// `npm run gen:apps-script` writes this (plus seed data) into
// apps-script/Schema.gs, which setup() uses to create every tab.
// The API converts headers to camelCase keys ("SEO Title" → seoTitle).

export const SHEET_HEADERS = {
  SERVICES: [
    "Service ID", "Service Name", "Category", "Slug", "Short Description", "Full Description", "Main Image",
    "Gallery Images", "Starting Price", "SEO Title", "SEO Description", "H1", "Image Alt", "Benefits", "Materials",
    "Design Examples", "FAQs", "Featured", "Display Order", "WhatsApp Message", "Active",
  ],
  PROJECTS: [
    "Project ID", "Project Name", "Slug", "Location", "Category", "Service Slug", "Description", "Project Date",
    "Area", "Budget Range", "Cover Image", "Gallery Images", "Featured", "Display Order", "Active",
  ],
  GALLERY: ["Image ID", "Project ID", "Category", "Image URL", "Title", "Description", "Display Order", "Active"],
  BEFORE_AFTER: ["ID", "Project Name", "Description", "Location", "Category", "Before Image", "After Image", "Display Order", "Active"],
  TESTIMONIALS: ["Testimonial ID", "Customer Name", "Location", "Project Type", "Review", "Rating", "Photo", "Display Order", "Active"],
  FACTORY: ["ID", "Type", "Title", "Description", "Image URL", "Display Order", "Active"],
  LEADS: [
    "Lead ID", "Date", "Time", "Name", "Phone", "WhatsApp", "Email", "City", "Property Type", "Requirement", "Budget",
    "Property Status", "Preferred Contact", "Message", "File URL", "Source", "Campaign", "UTM Source", "UTM Medium",
    "UTM Campaign", "UTM Content", "Status", "Assigned To", "Follow Up Date", "Last Contact Date", "Remarks",
    "Created At", "Updated At", "Form Type", "Landing Page", "Referrer", "Submission ID",
  ],
  EVENTS: [
    "Event ID", "Event Type", "Page", "Service", "Label", "Source", "Campaign", "UTM Source", "UTM Medium",
    "UTM Campaign", "UTM Content", "Date", "Time", "Created At",
  ],
  SOCIAL_POSTS: [
    "Post ID", "Content Type", "Platform", "Caption", "Image URL", "Video URL", "Hashtags", "Campaign ID",
    "Scheduled Date", "Scheduled Time", "Status", "Published URL", "Error Message", "Created At", "Updated At", "Container ID",
  ],
  CONTENT_CALENDAR: ["Day", "Category", "Service Slug", "Content Type", "Platform", "Time", "Active"],
  CAMPAIGNS: [
    "Campaign ID", "Campaign Name", "Platform", "Start Date", "End Date", "Landing Page", "UTM Source", "UTM Medium",
    "UTM Campaign", "UTM Content", "Leads", "WhatsApp Clicks", "Calls", "Conversions", "Status",
  ],
} as const;

/** SETTINGS is a key/value tab: [Setting label, settings key, help note]. */
export const SETTINGS_FIELDS: [string, string, string][] = [
  ["Company Name", "companyName", ""],
  ["Logo URL", "logoUrl", "Public image URL (PNG/SVG). Leave blank to use the text logo."],
  ["Phone", "phone", "Shown on the site and used for click-to-call"],
  ["WhatsApp Number", "whatsappNumber", "Country code + number, digits only, e.g. 919876543210"],
  ["Email", "email", ""],
  ["Office Address", "officeAddress", ""],
  ["Factory Address", "factoryAddress", ""],
  ["Google Maps URL", "googleMapsUrl", "Office directions link (optional)"],
  ["Factory Maps URL", "factoryMapsUrl", "Factory directions link (optional)"],
  ["Google Business Profile URL", "googleBusinessProfileUrl", "Used for 'See Our Google Reviews'"],
  ["Google Review URL", "googleReviewUrl", "Direct 'write a review' link"],
  ["Instagram URL", "instagramUrl", ""],
  ["Instagram Handle", "instagramHandle", "Without @"],
  ["Facebook URL", "facebookUrl", ""],
  ["YouTube URL", "youtubeUrl", ""],
  ["Working Hours", "workingHours", ""],
  ["WhatsApp Default Message", "whatsappDefaultMessage", ""],
  ["Footer Text", "footerText", ""],
  ["Primary CTA", "primaryCta", ""],
  ["Secondary CTA", "secondaryCta", ""],
  ["Default City", "defaultCity", "Replaces {city} in SEO fields"],
  ["Service Areas", "serviceAreas", "Comma separated. Each gets local SEO pages."],
  ["Staff Members", "staffMembers", "Comma separated. Used for lead assignment."],
  ["Hero Image", "heroImage", "Home page hero image URL"],
  ["Factory Hero Image", "factoryHeroImage", ""],
  ["About Image", "aboutImage", ""],
  ["Years Experience", "yearsExperience", "Optional. Only shown if filled."],
  ["Projects Completed", "projectsCompleted", "Optional. Only shown if filled."],
  ["Factory Area", "factoryArea", "Optional, e.g. 20,000 sq.ft"],
  ["Auto Publish", "autoPublish", "TRUE = approved posts with a date/time publish automatically"],
];

export type SheetName = keyof typeof SHEET_HEADERS | "SETTINGS";

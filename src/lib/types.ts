// Shared data contracts. Keys are the camelCase form of the Google Sheets
// column headers (e.g. "SEO Title" → seoTitle), produced by the Apps Script API.

export type Settings = {
  companyName: string;
  logoUrl: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  officeAddress: string;
  factoryAddress: string;
  googleMapsUrl: string;
  factoryMapsUrl: string;
  googleBusinessProfileUrl: string;
  googleReviewUrl: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  youtubeUrl: string;
  workingHours: string;
  whatsappDefaultMessage: string;
  footerText: string;
  primaryCta: string;
  secondaryCta: string;
  defaultCity: string;
  serviceAreas: string[];
  staffMembers: string[];
  heroImage: string;
  factoryHeroImage: string;
  aboutImage: string;
  yearsExperience: string;
  projectsCompleted: string;
  factoryArea: string;
  autoPublish: boolean;
};

export type FAQ = { q: string; a: string };

export type Service = {
  serviceId: string;
  serviceName: string;
  category: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  mainImage: string;
  galleryImages: string[];
  startingPrice: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  imageAlt: string;
  benefits: string[];
  materials: string[];
  designExamples: string[];
  faqs: FAQ[];
  featured: boolean;
  displayOrder: number;
  whatsappMessage: string;
  active: boolean;
};

export type Project = {
  projectId: string;
  projectName: string;
  slug: string;
  location: string;
  category: string;
  serviceSlug: string;
  description: string;
  projectDate: string;
  area: string;
  budgetRange: string;
  coverImage: string;
  galleryImages: string[];
  featured: boolean;
  displayOrder: number;
  active: boolean;
};

export type GalleryItem = {
  imageId: string;
  projectId: string;
  category: string;
  imageUrl: string;
  title: string;
  description: string;
  displayOrder: number;
  active: boolean;
};

export type BeforeAfter = {
  id: string;
  projectName: string;
  description: string;
  location: string;
  category: string;
  beforeImage: string;
  afterImage: string;
  displayOrder: number;
  active: boolean;
};

export type Testimonial = {
  testimonialId: string;
  customerName: string;
  location: string;
  projectType: string;
  review: string;
  rating: number;
  photo: string;
  displayOrder: number;
  active: boolean;
};

export type FactoryItem = {
  id: string;
  type: "process" | "capability" | "image";
  title: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  active: boolean;
};

export type SiteContent = {
  settings: Settings;
  services: Service[];
  projects: Project[];
  gallery: GalleryItem[];
  beforeAfter: BeforeAfter[];
  testimonials: Testimonial[];
  factory: FactoryItem[];
};

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Follow-up",
  "Site Visit",
  "Design",
  "Quotation",
  "Negotiation",
  "Confirmed",
  "Completed",
  "Lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Attribution = {
  source: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  landingPage: string;
  referrer: string;
};

export type Lead = {
  leadId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  propertyType: string;
  requirement: string;
  budget: string;
  propertyStatus: string;
  preferredContact: string;
  message: string;
  fileUrl: string;
  source: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  status: LeadStatus;
  assignedTo: string;
  followUpDate: string;
  lastContactDate: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadUpdate = Partial<
  Pick<Lead, "status" | "assignedTo" | "followUpDate" | "lastContactDate" | "remarks">
>;

export const TRACKED_EVENTS = [
  "whatsapp_click",
  "call_click",
  "instagram_click",
  "google_maps_click",
  "factory_visit_request",
  "quote_request",
  "consultation_request",
] as const;
export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

export type EventSummary = {
  byType: Record<string, number>;
  byCampaign: Record<string, Record<string, number>>;
  bySource: Record<string, Record<string, number>>;
};

export const SOCIAL_STATUSES = [
  "Draft",
  "Approved",
  "Scheduled",
  "Publishing",
  "Published",
  "Ready to Publish",
  "Failed",
] as const;
export type SocialStatus = (typeof SOCIAL_STATUSES)[number];
export const SOCIAL_PLATFORMS = ["Instagram", "Facebook", "YouTube", "LinkedIn", "Pinterest"] as const;
export const CONTENT_TYPES = ["Image", "Carousel", "Reel", "Video", "Story"] as const;

export type SocialPost = {
  postId: string;
  contentType: string;
  platform: string;
  caption: string;
  imageUrl: string;
  videoUrl: string;
  hashtags: string;
  campaignId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: SocialStatus;
  publishedUrl: string;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEntry = {
  day: string;
  category: string;
  serviceSlug: string;
  contentType: string;
  platform: string;
  time: string;
  active: boolean;
};

export type Campaign = {
  campaignId: string;
  campaignName: string;
  platform: string;
  startDate: string;
  endDate: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  leads: number;
  whatsappClicks: number;
  calls: number;
  conversions: number;
  status: string;
};

export type InstagramMedia = {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  timestamp: string;
};

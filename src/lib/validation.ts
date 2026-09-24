import { z } from "zod";
import { normalizePhone } from "./phone";

export { normalizePhone };

const text = (max: number) => z.string().trim().max(max).default("");
const phone = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const p = normalizePhone(v);
    if (!p) {
      ctx.addIssue({ code: "custom", message: "Enter a valid mobile number" });
      return z.NEVER;
    }
    return p;
  });

export const attributionSchema = z
  .object({
    source: text(40),
    campaign: text(120),
    utmSource: text(120),
    utmMedium: text(120),
    utmCampaign: text(120),
    utmContent: text(120),
    landingPage: text(300),
    referrer: text(300),
  })
  .partial()
  .default({});

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone,
  whatsapp: z.string().trim().max(20).default(""),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(120)]).default(""),
  city: text(60),
  propertyType: text(40),
  requirement: text(60),
  budget: text(40),
  propertyStatus: text(40),
  preferredContact: text(20),
  message: text(2000),
  submissionId: z.string().trim().min(8).max(64),
  formType: z.enum(["lead", "contact"]).default("lead"),
});

export const leadUpdateSchema = z.object({
  status: z.enum(["New", "Contacted", "Follow-up", "Site Visit", "Design", "Quotation", "Negotiation", "Confirmed", "Completed", "Lost"]).optional(),
  assignedTo: z.string().trim().max(60).optional(),
  followUpDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  lastContactDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  remarks: z.string().trim().max(1000).optional(),
});

export const eventSchema = z.object({
  eventType: z.enum(["whatsapp_click", "call_click", "instagram_click", "google_maps_click", "factory_visit_request", "quote_request", "consultation_request"]),
  page: text(300),
  service: text(80),
  label: text(120),
  attribution: attributionSchema,
});

export const socialPostSchema = z.object({
  postId: z.string().trim().max(30).optional(),
  contentType: z.enum(["Image", "Carousel", "Reel", "Video", "Story"]).optional(),
  platform: z.enum(["Instagram", "Facebook", "YouTube", "LinkedIn", "Pinterest"]).optional(),
  caption: z.string().max(2200).optional(),
  imageUrl: z.string().max(3000).optional(),
  videoUrl: z.string().max(1000).optional(),
  hashtags: z.string().max(1000).optional(),
  campaignId: z.string().max(40).optional(),
  scheduledDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  scheduledTime: z.union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/)]).optional(),
  status: z.enum(["Draft", "Approved", "Scheduled", "Publishing", "Published", "Ready to Publish", "Failed"]).optional(),
});

export const campaignSchema = z.object({
  campaignId: z.string().trim().max(30).optional(),
  campaignName: z.string().trim().min(2).max(120),
  platform: text(40),
  startDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).default(""),
  endDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).default(""),
  landingPage: text(300),
  utmSource: text(120),
  utmMedium: text(120),
  utmCampaign: text(120),
  utmContent: text(120),
  status: text(20),
});

export const calendarSchema = z.array(
  z.object({
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    category: z.string().trim().max(80),
    serviceSlug: z.string().trim().max(80).default(""),
    contentType: z.string().trim().max(20).default("Image"),
    platform: z.string().trim().max(20).default("Instagram"),
    time: z.string().regex(/^\d{2}:\d{2}$/).default("18:30"),
    active: z.boolean().default(true),
  }),
).max(21);

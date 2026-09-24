// Deterministic, template-based social content generator. Produces a draft
// the admin reviews and edits — nothing is published without approval unless
// "Auto Publish" is explicitly enabled in Settings.

export const TOPICS = [
  "Modular Kitchen",
  "Bedroom Interior",
  "Factory / Manufacturing",
  "Before & After",
  "Completed Project",
  "Interior Tip",
  "Consultation / CTA",
  "Wardrobe",
  "Living Room",
  "Office Interior",
] as const;

export const TONES = ["Professional", "Warm & Friendly", "Luxury", "Informative"] as const;
export const CTAS = ["Book a free consultation", "WhatsApp us", "Visit our factory", "Send your floor plan", "Link in bio"] as const;

export type GeneratorInput = {
  topic: string;
  service: string;
  platform: string;
  contentType: string;
  tone: string;
  project: string;
  cta: string;
  city: string;
  company: string;
  variant: number;
};

export type GeneratedContent = {
  caption: string;
  shortCaption: string;
  hashtags: string;
  cta: string;
  websiteContent: string;
};

const pick = <T,>(arr: readonly T[], n: number) => arr[((n % arr.length) + arr.length) % arr.length];
const tag = (s: string) => "#" + s.replace(/&/g, "and").replace(/[^a-zA-Z0-9]/g, "");

const HOOKS: Record<string, string[]> = {
  "Modular Kitchen": [
    "A kitchen that works as hard as you do.",
    "Every drawer, every corner — planned around how you cook.",
    "From 3D design to factory-made cabinets: this is how a modular kitchen should come together.",
  ],
  "Bedroom Interior": [
    "Calm, clutter-free and made to measure.",
    "A bedroom designed for rest — with storage that disappears into the design.",
    "Soft textures, warm light and smart storage.",
  ],
  "Factory / Manufacturing": [
    "Behind every interior we install is our own factory.",
    "Precision cutting, clean edge banding, careful assembly — made in-house.",
    "This is where your design becomes real furniture.",
  ],
  "Before & After": [
    "Swipe to see the transformation.",
    "Same space. Completely new story.",
    "Before → After. Designed, manufactured and installed by our team.",
  ],
  "Completed Project": [
    "Freshly handed over — and we love how it turned out.",
    "Another home completed, end to end.",
    "Designed in 3D, built in our factory, installed by our team.",
  ],
  "Interior Tip": [
    "Interior tip of the week 👇",
    "Planning your interiors? Save this.",
    "One small decision that makes a big difference:",
  ],
  "Consultation / CTA": [
    "Planning your interiors this season?",
    "Got your keys? Let's design your space.",
    "Your dream space starts with one conversation.",
  ],
  Wardrobe: ["Wardrobes planned from the inside out.", "Storage that fits your life — not the other way around.", "Floor-to-ceiling, made to measure."],
  "Living Room": ["The room where your home says hello.", "Feature walls, warm lighting, thoughtful storage.", "Designed for everyday living and weekend gatherings."],
  "Office Interior": ["Workspaces that help teams do their best work.", "Modular workstations, built in our own factory.", "Your brand, reflected in your workspace."],
};

const BODIES: Record<string, string[]> = {
  "Modular Kitchen": [
    "Our designers plan the work triangle, storage and appliances in 3D — then every cabinet is manufactured in our own factory for a precise fit.",
    "Moisture-resistant materials, soft-close hardware and smart corner solutions, built to last for years of daily cooking.",
  ],
  "Bedroom Interior": [
    "Wardrobes, storage beds and dressing units designed around your room's exact measurements.",
    "We plan storage, lighting and finishes together so the room feels calm and complete.",
  ],
  "Factory / Manufacturing": [
    "Panel cutting → edge banding → drilling/CNC → assembly → quality inspection. Every step under one roof, so quality and timelines stay in our control.",
    "Owning the factory means we can coordinate design, production, quality and delivery through one system.",
  ],
  "Before & After": [
    "We handled everything — design, manufacturing and installation — so the homeowners dealt with just one team.",
    "Space planning, material selection and factory-made modular units turned this space around.",
  ],
  "Completed Project": [
    "Modular units made in our factory and installed by our own team — one point of contact from start to finish.",
    "From first consultation to final handover, every step was coordinated by one team.",
  ],
  "Interior Tip": [
    "Choose BWP-grade plywood for kitchen base units near the sink — it handles moisture far better over the years.",
    "Plan your electrical points before finalising furniture layouts. It saves rework and keeps wires hidden.",
    "Use lofts above wardrobes for seasonal storage — it's the easiest way to add space without adding furniture.",
  ],
  "Consultation / CTA": [
    "Share your floor plan and requirements — our designer will call you with ideas and next steps.",
    "Free consultation, 3D design, factory manufacturing and installation — all with one team.",
  ],
  Wardrobe: ["Sliding, hinged or walk-in — with internal layouts designed for how you actually use them.", "Lofts, drawers, lockers and accessories, manufactured in our factory."],
  "Living Room": ["TV units, panelling, display and concealed storage — designed as one composition.", "Layered lighting and balanced layouts make the room work day and night."],
  "Office Interior": ["Workstations, cabins, meeting rooms and reception — manufactured in-house and installed with minimal disruption.", "Designed for productivity, built for daily use."],
};

const TONE_PREFIX: Record<string, string> = {
  Professional: "",
  "Warm & Friendly": "✨ ",
  Luxury: "",
  Informative: "💡 ",
};

const CTA_LINES: Record<string, string> = {
  "Book a free consultation": "Book your free consultation today — link in bio.",
  "WhatsApp us": "WhatsApp us to discuss your space.",
  "Visit our factory": "Want to see how it's made? Book a factory visit.",
  "Send your floor plan": "Send us your floor plan on WhatsApp for design ideas.",
  "Link in bio": "Explore more on our website — link in bio.",
};

export function generateContent(i: GeneratorInput): GeneratedContent {
  const topic = HOOKS[i.topic] ? i.topic : "Completed Project";
  const hook = pick(HOOKS[topic], i.variant);
  const body = pick(BODIES[topic], i.variant + 1);
  const projectLine = i.project ? `📍 ${i.project}${i.city ? `, ${i.city}` : ""}` : i.city ? `📍 ${i.city}` : "";
  const luxury = i.tone === "Luxury" ? "Crafted with care, finished to perfection." : "";
  const cta = CTA_LINES[i.cta] || CTA_LINES["Book a free consultation"];
  const serviceLine = i.service ? `Service: ${i.service}` : "";

  const hashtags = [
    ...new Set([
      tag(i.company),
      "#InteriorDesign",
      "#ModularInteriors",
      "#HomeInteriors",
      i.service && tag(i.service),
      topic === "Modular Kitchen" && "#ModularKitchen",
      topic === "Wardrobe" && "#Wardrobe",
      topic === "Factory / Manufacturing" && "#MadeInOurFactory",
      topic === "Before & After" && "#BeforeAndAfter",
      topic === "Interior Tip" && "#InteriorTips",
      i.city && tag(`${i.city}Interiors`),
      i.city && tag(`InteriorDesigner${i.city}`),
      "#DesignManufactureInstall",
      i.contentType === "Reel" && "#Reels",
    ].filter(Boolean) as string[]),
  ].slice(0, i.platform === "Instagram" ? 15 : 6);

  const caption = [
    `${TONE_PREFIX[i.tone] || ""}${hook}`,
    "",
    body,
    luxury,
    projectLine,
    serviceLine,
    "",
    `👉 ${cta}`,
    i.platform === "YouTube" ? `\n${i.company} — Design → Manufacturing → Installation.` : "",
  ]
    .filter((l, idx, arr) => !(l === "" && arr[idx - 1] === ""))
    .join("\n")
    .trim();

  return {
    caption,
    shortCaption: `${hook} ${cta}`,
    hashtags: hashtags.join(" "),
    cta,
    websiteContent: `${hook} ${body} ${i.company} designs, manufactures and installs complete modular interiors${i.city ? ` in ${i.city}` : ""}.`,
  };
}

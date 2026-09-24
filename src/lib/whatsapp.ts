export function whatsappUrl(number: string, message: string) {
  const n = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export const telUrl = (phone: string) => `tel:${phone.replace(/[^0-9+]/g, "")}`;

export const WA_MESSAGES = {
  default: "Hello, I am interested in your interior design services. I would like to discuss my project.",
  quote: "Hello, I would like to get a quote for my interior project.",
  floorPlan: "Hello, I would like to send my floor plan and discuss my interior requirements.",
  designer: "Hello, I would like to talk to your designer about my interior project.",
  factory: "Hello, I would like to schedule a visit to your factory.",
  similar: (name: string) => `Hello, I liked your project "${name}". I would like a similar design for my space.`,
  service: (service: string) => `Hello, I am interested in ${service}. Please contact me for a consultation.`,
  afterLead: (leadId: string) => `Hello, I submitted an interior enquiry through your website. My Lead ID is ${leadId}.`,
};

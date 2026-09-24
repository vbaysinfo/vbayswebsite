"use client";

import { Phone } from "lucide-react";
import { track, type AnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { telUrl, whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icons";

type WAProps = {
  number: string;
  message: string;
  label?: string;
  service?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "link" | "icon";
  children?: React.ReactNode;
};

/** WhatsApp click-to-chat with a pre-filled message; every click is tracked. */
export function WhatsAppButton({ number, message, label = "Chat on WhatsApp", service, className, size = "md", variant = "solid", children }: WAProps) {
  return (
    <a
      href={whatsappUrl(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { service, label })}
      aria-label={variant === "icon" ? label : undefined}
      className={cn(
        variant === "solid" && ["btn btn-wa", size === "lg" && "btn-lg", size === "sm" && "btn-sm"],
        variant === "link" && "inline-flex items-center gap-2 font-semibold text-wa hover:underline",
        className,
      )}
    >
      {children ?? (
        <>
          <WhatsAppIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
          {variant !== "icon" && <span>{label}</span>}
        </>
      )}
    </a>
  );
}

export function CallButton({ phone, label = "Call Now", className, size = "md", service, children }: {
  phone: string; label?: string; className?: string; size?: "sm" | "md" | "lg"; service?: string; children?: React.ReactNode;
}) {
  return (
    <a
      href={telUrl(phone)}
      onClick={() => track("call_click", { service, label })}
      className={cn(!children && ["btn btn-outline", size === "lg" && "btn-lg", size === "sm" && "btn-sm"], className)}
    >
      {children ?? (
        <>
          <Phone className="h-4 w-4" aria-hidden />
          <span>{label}</span>
        </>
      )}
    </a>
  );
}

/** External link that fires an analytics (and first-party) event on click. */
export function TrackedLink({ href, event, label, className, children, service, external = true }: {
  href: string; event: AnalyticsEvent; label?: string; className?: string; children: React.ReactNode; service?: string; external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => track(event, { label, service })}
      className={className}
    >
      {children}
    </a>
  );
}

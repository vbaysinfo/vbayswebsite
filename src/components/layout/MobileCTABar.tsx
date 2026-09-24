"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Phone } from "lucide-react";
import { track } from "@/lib/analytics";
import { telUrl, whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icons";

/** Sticky bottom bar on mobile: [Call] [WhatsApp] [Get Quote]. */
export function MobileCTABar({ phone, whatsappNumber, message }: { phone: string; whatsappNumber: string; message: string }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur md:hidden">
      <div className="grid grid-cols-3 gap-2">
        <a href={telUrl(phone)} onClick={() => track("call_click", { label: "mobile_bar" })} className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-line bg-white text-xs font-bold text-ink">
          <Phone className="h-5 w-5" aria-hidden />
          Call
        </a>
        <a
          href={whatsappUrl(whatsappNumber, message)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp_click", { label: "mobile_bar" })}
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl bg-wa text-xs font-bold text-white"
        >
          <WhatsAppIcon className="h-5 w-5" />
          WhatsApp
        </a>
        <Link href="/get-quote" onClick={() => track("quote_request", { label: "mobile_bar" })} className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl bg-ink text-xs font-bold text-white">
          <FileText className="h-5 w-5" aria-hidden />
          Get Quote
        </Link>
      </div>
    </div>
  );
}

"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

const OPTIMIZED_HOSTS = [/(^|\.)images\.unsplash\.com$/, /(^|\.)lh3\.googleusercontent\.com$/, /(^|\.)drive\.google\.com$/, /(^|\.)res\.cloudinary\.com$/, /\.cdninstagram\.com$/, /\.fbcdn\.net$/];

function canOptimize(src: string) {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return OPTIMIZED_HOSTS.some((r) => r.test(host));
  } catch {
    return false;
  }
}

/** Converts Google Drive share links into directly embeddable image URLs. */
export function resolveImageUrl(src: string) {
  const m = src.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w2000` : src;
}

type Props = Omit<ImageProps, "src" | "alt"> & { src?: string; alt: string; label?: string };

/**
 * Image loaded from a URL in Google Sheets. Uses next/image optimisation for
 * known hosts and degrades to an elegant placeholder when the URL is missing
 * or broken — the layout never shows a broken image icon.
 */
export function SmartImage({ src, alt, label, className, fill, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  const url = src ? resolveImageUrl(src) : "";
  if (!url || failed) {
    // Elegant architectural placeholder: warm plaster gradient + line-drawn arch.
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center overflow-hidden bg-[radial-gradient(120%_90%_at_30%_20%,#f4ece0_0%,#e6d9c6_45%,#cdb99c_100%)] text-brass-dark",
          fill ? "absolute inset-0" : "",
          className,
        )}
      >
        <svg viewBox="0 0 120 120" className="h-1/3 max-h-28 w-auto opacity-35" fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden>
          <path d="M30 108V56a30 30 0 0 1 60 0v52" />
          <path d="M40 108V60a20 20 0 0 1 40 0v48" />
          <path d="M14 108h92" />
          <circle cx="60" cy="40" r="3" />
        </svg>
        {label ? <span className="sr-only">{label}</span> : null}
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      fill={fill}
      className={className}
      unoptimized={!canOptimize(url)}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

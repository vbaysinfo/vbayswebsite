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
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center overflow-hidden bg-gradient-to-br from-sand via-stone to-brass-soft text-brass-dark",
          fill ? "absolute inset-0" : "",
          className,
        )}
      >
        <svg viewBox="0 0 120 80" className="h-1/4 max-h-14 w-auto opacity-30" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
          <path d="M8 72h104M16 72V30l44-22 44 22v42" />
          <path d="M34 72V44h22v28M66 44h22v14H66z" />
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

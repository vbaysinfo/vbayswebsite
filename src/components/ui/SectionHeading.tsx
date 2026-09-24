import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

/** Editorial heading. Wrap a word in <em> to render it as the gold italic accent. */
export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
  className,
  as: Tag = "h2",
  light = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
  light?: boolean;
}) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className={cn("eyebrow mb-6", light && "text-brass", align === "center" && "justify-center")}>{eyebrow}</p> : null}
      <Tag className={cn("text-[2.35rem] leading-[1.05] md:text-6xl [&_em]:gold-italic", light ? "text-white" : "text-ink")}>{title}</Tag>
      {text ? <p className={cn("mt-6 max-w-2xl text-base leading-relaxed md:text-lg", align === "center" && "mx-auto", light ? "text-white/70" : "text-muted")}>{text}</p> : null}
    </Reveal>
  );
}

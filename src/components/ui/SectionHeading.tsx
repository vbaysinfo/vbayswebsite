import { cn } from "@/lib/cn";

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
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <p className={cn("eyebrow mb-4", light && "text-brass-soft", align === "center" && "justify-center")}>{eyebrow}</p> : null}
      <Tag className={cn("text-3xl leading-[1.12] font-medium md:text-[2.75rem]", light ? "text-white" : "text-ink")}>{title}</Tag>
      {text ? <p className={cn("mt-5 text-base leading-relaxed md:text-lg", light ? "text-white/75" : "text-muted")}>{text}</p> : null}
    </div>
  );
}

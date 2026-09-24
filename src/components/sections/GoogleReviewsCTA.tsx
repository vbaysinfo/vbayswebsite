import type { Settings } from "@/lib/types";
import { GoogleIcon } from "@/components/ui/Icons";
import { TrackedLink } from "@/components/cta/TrackedLinks";

/** Links to the real Google Business Profile — no reviews are fabricated or copied. */
export function GoogleReviewsCTA({ settings }: { settings: Settings }) {
  if (!settings.googleBusinessProfileUrl && !settings.googleReviewUrl) return null;
  return (
    <section className="pb-16 md:pb-24">
      <div className="container-x">
        <div className="card flex flex-col items-center justify-between gap-6 p-7 text-center md:flex-row md:p-9 md:text-left">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-stone"><GoogleIcon className="h-7 w-7" /></span>
            <div>
              <p className="font-display text-2xl">Read what customers say on Google</p>
              <p className="mt-1 text-sm text-muted">Real, verified reviews on our Google Business Profile.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {settings.googleBusinessProfileUrl && (
              <TrackedLink href={settings.googleBusinessProfileUrl} event="google_maps_click" label="see_reviews" className="btn btn-outline">See Our Google Reviews</TrackedLink>
            )}
            {settings.googleReviewUrl && (
              <TrackedLink href={settings.googleReviewUrl} event="google_maps_click" label="write_review" className="btn btn-primary">Review Us on Google</TrackedLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

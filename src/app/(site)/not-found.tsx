import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid min-h-[70vh] place-items-center px-5 pt-24 text-center">
      <div>
        <p className="eyebrow justify-center">404</p>
        <h1 className="mt-4 text-4xl font-medium">This page isn&apos;t here</h1>
        <p className="mt-3 text-muted">It may have moved. Explore our interiors or get in touch.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/interiors" className="btn btn-primary">Interior Services</Link>
          <Link href="/contact" className="btn btn-outline">Contact</Link>
        </div>
      </div>
    </section>
  );
}

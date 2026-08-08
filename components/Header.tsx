import Link from "next/link";

export function Header() {
  return (
    <header className="relative mx-auto max-w-3xl px-6 pb-8 pt-14 text-center sm:pt-20">
      <h1 className="font-display text-6xl text-white sm:text-7xl">
        Vidyut's Photobook
      </h1>

      <p className="mt-2 text-sm text-white/80">
        any photos from the birthday paste here
      </p>

      <Link
        href="/book"
        className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 font-display text-xl text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20"
      >
        📖 Open the photo book
      </Link>

      <div
        aria-hidden="true"
        className="mx-auto mt-8 h-px max-w-xs border-t-2 border-dashed border-white/25"
      />
    </header>
  );
}

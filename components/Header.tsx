export function Header() {
  return (
    <header className="relative mx-auto max-w-3xl px-6 pb-8 pt-14 text-center sm:pt-20">
      <h1 className="font-display text-6xl text-white sm:text-7xl">
        Vidyut's Photobook
      </h1>

      <p className="mt-2 text-sm text-white/80">
        any photos from the birthday paste here
      </p>

      <div
        aria-hidden="true"
        className="mx-auto mt-8 h-px max-w-xs border-t-2 border-dashed border-white/25"
      />
    </header>
  );
}

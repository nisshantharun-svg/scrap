"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePhotos } from "@/hooks/usePhotos";

export default function BookPage() {
  const { photos, isLoading, error } = usePhotos();
  const [page, setPage] = useState(0);
  const bookPhotos = photos.slice(0, 5);
  const photo = bookPhotos[page];
  const hasPhotos = bookPhotos.length > 0;

  const next = () => setPage((current) => Math.min(current + 1, bookPhotos.length - 1));
  const previous = () => setPage((current) => Math.max(current - 1, 0));

  return (
    <main className="min-h-screen overflow-hidden bg-[#17212b] px-4 py-8 text-[#f7f0df] sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-typewriter text-sm text-white/70 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to scrapbook</Link>
          <p className="font-display text-2xl">The Photo Book</p>
        </div>

        <div className="flex flex-1 items-center justify-center">
          {isLoading && <p className="font-typewriter text-white/60">Opening the book...</p>}
          {error && !hasPhotos && <p className="font-typewriter text-white/70">{error}</p>}

          {!isLoading && !error && !hasPhotos && (
            <div className="max-w-md text-center">
              <p className="font-display text-4xl">Your book is waiting for its first memory.</p>
              <Link href="/" className="mt-6 inline-flex rounded-full bg-white/10 px-5 py-2 font-display text-xl hover:bg-white/20">Add photos</Link>
            </div>
          )}

          {!isLoading && hasPhotos && photo && (
            <div className="w-full max-w-5xl">
              <div className="relative mx-auto min-h-[62vh] max-w-4xl overflow-hidden rounded-md bg-[#eadfc7] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]">
                <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px bg-black/15" />
                <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(0,0,0,.08),transparent_8%,transparent_92%,rgba(0,0,0,.08))]" />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={photo.id} initial={{ rotateY: page > 0 ? 75 : 0, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -75, opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="relative flex min-h-[62vh] items-center justify-center p-5 sm:p-10" style={{ perspective: "1200px" }}>
                    <div className="relative flex max-h-[55vh] w-full items-center justify-center overflow-hidden bg-white p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,.35)] sm:w-[82%]">
                      <img src={photo.src} alt={photo.caption || photo.name} className="max-h-[50vh] w-auto max-w-full object-contain" />
                      {photo.caption && <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-white/90 px-3 py-1 font-display text-xl text-ink">{photo.caption}</p>}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-7 flex items-center justify-center gap-6">
                <button type="button" onClick={previous} disabled={page === 0} aria-label="Previous spread" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-25"><ChevronLeft /></button>
                <span className="font-typewriter text-xs tracking-[0.2em] text-white/60">PHOTO {page + 1} / {bookPhotos.length}</span>
                <button type="button" onClick={next} disabled={page === bookPhotos.length - 1} aria-label="Next spread" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-25"><ChevronRight /></button>
              </div>

              {bookPhotos.length < 5 && (
                <div className="mt-6 flex justify-center">
                  <Link href="/" aria-label="Add another photo" title="Add another photo" className="group flex h-24 w-24 items-center justify-center rounded-sm border-2 border-dashed border-white/35 bg-white/5 text-white/50 transition hover:border-white/65 hover:bg-white/10 hover:text-white">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-white/35 transition group-hover:border-white/65"><Plus className="h-6 w-6" /></span>
                  </Link>
                </div>
              )}
              <p className="mt-3 text-center font-typewriter text-xs text-white/40">Each double-page spread counts as one photo • Up to 5 photos per book</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

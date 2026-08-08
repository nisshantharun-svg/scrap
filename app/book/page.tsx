"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { usePhotos } from "@/hooks/usePhotos";

export default function BookPage() {
  const { photos, isLoading, error } = usePhotos();
  const [page, setPage] = useState(0);

  const next = () => setPage((current) => Math.min(current + 1, photos.length - 1));
  const previous = () => setPage((current) => Math.max(current - 1, 0));
  const photo = photos[page];

  return (
    <main className="min-h-screen overflow-hidden bg-[#17212b] px-4 py-8 text-[#f7f0df] sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-typewriter text-sm text-white/70 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to scrapbook
          </Link>
          <p className="font-display text-2xl">The Photo Book</p>
        </div>

        <div className="flex flex-1 items-center justify-center">
          {isLoading && <p className="font-typewriter text-white/60">Opening the book...</p>}
          {error && photos.length === 0 && <p className="font-typewriter text-white/70">{error}</p>}
          {!isLoading && !error && photos.length === 0 && <p className="font-display text-3xl">The book is empty.</p>}

          {!isLoading && photo && (
            <div className="w-full max-w-5xl">
              <div className="relative mx-auto grid min-h-[62vh] max-w-4xl grid-cols-1 overflow-hidden rounded-md bg-[#eadfc7] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] sm:grid-cols-2">
                <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-px bg-black/15 sm:block" />
                <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(0,0,0,.08),transparent_8%,transparent_92%,rgba(0,0,0,.08))]" />

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={photo.id}
                    initial={{ rotateY: page > 0 ? 75 : 0, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -75, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative col-span-full flex min-h-[62vh] items-center justify-center p-5 sm:p-10"
                    style={{ perspective: "1200px" }}
                  >
                    <div className="relative max-h-[55vh] w-full overflow-hidden bg-white p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,.35)] sm:w-[72%]">
                      <img src={photo.src} alt={photo.caption || photo.name} className="mx-auto max-h-[50vh] w-auto max-w-full object-contain" />
                      {photo.caption && <p className="mt-3 text-center font-display text-2xl text-ink">{photo.caption}</p>}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-7 flex items-center justify-center gap-6">
                <button type="button" onClick={previous} disabled={page === 0} aria-label="Previous page" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-25">
                  <ChevronLeft />
                </button>
                <span className="font-typewriter text-xs tracking-[0.2em] text-white/60">PAGE {page + 1} / {photos.length}</span>
                <button type="button" onClick={next} disabled={page === photos.length - 1} aria-label="Next page" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-25">
                  <ChevronRight />
                </button>
              </div>
              <p className="mt-3 text-center font-typewriter text-xs text-white/40">Use the arrows or swipe on the photo</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

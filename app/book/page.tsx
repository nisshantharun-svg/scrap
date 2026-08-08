"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePhotos } from "@/hooks/usePhotos";
import type { Photo } from "@/lib/types";

const PAGE_MIN = 3;
const PAGE_MAX = 5;

function buildPages(photos: Photo[]) {
  const pages: Photo[][] = [];
  for (let i = 0; i < photos.length; i += PAGE_MAX) pages.push(photos.slice(i, i + PAGE_MAX));
  return pages;
}

function PhotoPage({ photos, pageIndex }: { photos: Photo[]; pageIndex: number }) {
  const rotations = [-3, 2, -1.5, 3, -2];
  return (
    <section className="relative min-h-[52vh] flex-1 overflow-hidden bg-[#f1e5ca] p-3 shadow-inner sm:min-h-[58vh] sm:p-5">
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.8),transparent_35%)]" />
      <div className="relative grid min-h-[46vh] grid-cols-2 content-center gap-3 sm:min-h-[50vh] sm:gap-4">
        {photos.map((photo, index) => (
          <motion.figure key={photo.id} initial={{ opacity: 0, scale: .92, rotate: rotations[index] }} animate={{ opacity: 1, scale: 1, rotate: rotations[index] }} className="relative flex min-h-0 items-center justify-center bg-[#fffdf8] p-0.5 shadow-[0_4px_10px_-6px_rgba(51,64,77,.4)] sm:p-1">
            <div className="flex min-h-0 w-full items-center justify-center overflow-hidden">
              <img src={photo.src} alt={photo.caption || photo.name} className="block h-auto max-h-[24vh] w-auto max-w-full object-contain sm:max-h-[27vh]" />
            </div>
            {photo.caption && <figcaption className="mt-0.5 max-w-full truncate px-1 text-center font-display text-xs text-ink sm:text-base">{photo.caption}</figcaption>}
          </motion.figure>
        ))}
        {photos.length < PAGE_MIN && (
          <Link href="/" aria-label="Add a photo" title="Add a photo" className="flex aspect-[4/3] items-center justify-center rounded-sm border-2 border-dashed border-ink/25 bg-white/20 text-ink/45 transition hover:border-ink/50 hover:bg-white/35 hover:text-ink/70">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-current sm:h-11 sm:w-11"><Plus /></span>
          </Link>
        )}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-typewriter text-[8px] tracking-[.2em] text-ink/35">PAGE {pageIndex + 1}</div>
    </section>
  );
}

export default function BookPage() {
  const { photos, isLoading, error } = usePhotos();
  const [spread, setSpread] = useState(0);
  const pages = useMemo(() => buildPages(photos), [photos]);
  const left = pages[spread * 2] ?? [];
  const right = pages[spread * 2 + 1] ?? [];
  const hasPhotos = photos.length > 0;
  const spreadCount = Math.max(1, Math.ceil(pages.length / 2));
  const turn = (direction: 1 | -1) => setSpread((current) => Math.max(0, Math.min(current + direction, spreadCount - 1)));

  return (
    <main className="min-h-screen overflow-hidden bg-[#17212b] px-3 py-6 text-[#f7f0df] sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
        <header className="mb-5 flex items-center justify-between sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-typewriter text-xs text-white/70 transition hover:text-white sm:text-sm"><ArrowLeft className="h-4 w-4" /> Back to scrapbook</Link>
          <p className="font-display text-xl sm:text-3xl">The Photo Book</p>
        </header>
        <div className="flex flex-1 items-center justify-center">
          {isLoading && <p className="font-typewriter text-white/60">Opening the book...</p>}
          {error && !hasPhotos && <p className="font-typewriter text-white/70">{error}</p>}
          {!isLoading && !error && !hasPhotos && <div className="text-center"><p className="font-display text-3xl sm:text-5xl">Your book is waiting for its first memory.</p><Link href="/" className="mt-5 inline-flex rounded-full bg-white/10 px-5 py-2 font-display text-lg hover:bg-white/20">Add photos</Link></div>}
          {!isLoading && hasPhotos && (
            <div className="w-full max-w-6xl">
              <div className="relative mx-auto flex max-w-6xl overflow-hidden rounded-lg bg-[#d8c9a9] shadow-[0_35px_90px_-25px_rgba(0,0,0,.7)] [perspective:1800px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={spread} initial={{ rotateY: spread > 0 ? -88 : 0, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: 88, opacity: 0 }} transition={{ duration: .7, ease: [0.22,1,0.36,1] }} className="flex w-full flex-col sm:flex-row" style={{ transformOrigin: spread > 0 ? "left center" : "center center", transformStyle: "preserve-3d" }}>
                    <PhotoPage photos={left} pageIndex={spread * 2} />
                    <div className="h-px w-full bg-black/20 shadow-[0_0_10px_rgba(0,0,0,.18)] sm:h-auto sm:w-px" />
                    <PhotoPage photos={right} pageIndex={spread * 2 + 1} />
                  </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-6 -translate-x-1/2 bg-gradient-to-r from-black/10 via-black/5 to-black/10 sm:block" />
              </div>
              <div className="mt-5 flex items-center justify-center gap-4 sm:mt-7 sm:gap-7">
                <button type="button" onClick={() => turn(-1)} disabled={spread === 0} aria-label="Previous spread" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-20 sm:h-12 sm:w-12"><ChevronLeft /></button>
                <span className="font-typewriter text-[9px] tracking-[.18em] text-white/55 sm:text-xs">SPREAD {spread + 1} / {spreadCount}</span>
                <button type="button" onClick={() => turn(1)} disabled={spread === spreadCount - 1} aria-label="Next spread" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-20 sm:h-12 sm:w-12"><ChevronRight /></button>
              </div>
              <p className="mt-3 text-center font-typewriter text-[9px] text-white/35 sm:text-xs">Photos are always shown in full • each page holds 3–5 photos when possible • double-spread photos count as one</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

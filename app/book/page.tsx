"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePhotos } from "@/hooks/usePhotos";
import type { Photo } from "@/lib/types";

const PAGE_MIN = 3;
const PAGE_MAX = 5;
const SWIPE_THRESHOLD = 60;

function buildPages(photos: Photo[]) {
  const pages: Photo[][] = [];
  for (let i = 0; i < photos.length; i += PAGE_MAX) pages.push(photos.slice(i, i + PAGE_MAX));
  return pages;
}

function PhotoItem({ photo, rotation }: { photo: Photo; rotation: number }) {
  const [orientation, setOrientation] = useState<"landscape" | "portrait" | "square">("square");

  const imageClass =
    orientation === "portrait"
      ? "max-h-[30vh] max-w-[68%] sm:max-h-[34vh] sm:max-w-[72%] landscape:max-h-[32vh] landscape:max-w-[72%]"
      : orientation === "landscape"
        ? "max-h-[23vh] max-w-[94%] sm:max-h-[27vh] sm:max-w-[94%] landscape:max-h-[23vh] landscape:max-w-[94%]"
        : "max-h-[27vh] max-w-[82%] sm:max-h-[31vh] sm:max-w-[84%] landscape:max-h-[27vh] landscape:max-w-[84%]";

  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.92, rotate: rotation }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      className="relative flex min-h-0 w-fit max-w-full justify-self-center items-center justify-center"
    >
      <div className="flex max-h-[32vh] max-w-full items-center justify-center overflow-visible rounded-[2px] border border-ink/20 bg-[#fffdf8] p-[3px] shadow-[0_2px_5px_-4px_rgba(51,64,77,.35)] sm:max-h-[36vh] sm:p-1 landscape:max-h-[34vh] landscape:p-[3px]">
        <img
          src={photo.src}
          alt={photo.caption || photo.name}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            setOrientation(
              naturalWidth > naturalHeight ? "landscape" : naturalHeight > naturalWidth ? "portrait" : "square",
            );
          }}
          className={`block h-auto w-auto object-contain ${imageClass}`}
          draggable={false}
        />
      </div>
      {photo.caption && (
        <figcaption className="mt-0.5 max-w-full truncate px-1 text-center font-display text-xs text-ink sm:text-base">
          {photo.caption}
        </figcaption>
      )}
    </motion.figure>
  );
}

function PhotoPage({ photos, pageIndex }: { photos: Photo[]; pageIndex: number }) {
  const rotations = [-3, 2, -1.5, 3, -2];

  return (
    <section className="paper-grain relative min-h-[52vh] flex-1 overflow-hidden rounded-sm bg-cardstock px-[10px] py-[10px] shadow-[0_20px_50px_-20px_rgba(51,64,77,0.45)] sm:min-h-[58vh] sm:px-10 sm:py-10 landscape:min-h-0 landscape:px-[10px] landscape:py-[10px]">
      <div className="pointer-events-none absolute inset-x-4 top-3 h-px bg-white/40 sm:inset-x-10" aria-hidden="true" />
      <div className="relative grid min-h-[46vh] grid-cols-2 content-center gap-[10px] sm:min-h-[50vh] sm:gap-5 landscape:min-h-0 landscape:gap-[10px]">
        {photos.map((photo, index) => (
          <PhotoItem key={photo.id} photo={photo} rotation={rotations[index]} />
        ))}
        {photos.length < PAGE_MIN && (
          <Link
            href="/"
            aria-label="Add a photo"
            title="Add a photo"
            className="flex aspect-[4/3] items-center justify-center rounded-sm border-2 border-dashed border-ink/25 bg-white/20 text-ink/45 transition hover:border-ink/50 hover:bg-white/35 hover:text-ink/70"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-current sm:h-11 sm:w-11">
              <Plus />
            </span>
          </Link>
        )}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-typewriter text-[8px] tracking-[.2em] text-ink/35 landscape:bottom-0.5">
        PAGE {pageIndex + 1}
      </div>
    </section>
  );
}

export default function BookPage() {
  const { photos, isLoading, error } = usePhotos();
  const [spread, setSpread] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchTracking = useRef(false);
  const pages = useMemo(() => buildPages(photos), [photos]);
  const left = pages[spread * 2] ?? [];
  const right = pages[spread * 2 + 1] ?? [];
  const hasPhotos = photos.length > 0;
  const spreadCount = Math.max(1, Math.ceil(pages.length / 2));

  const turn = (direction: 1 | -1) => {
    setSpread((current) => Math.max(0, Math.min(current + direction, spreadCount - 1)));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    touchTracking.current = false;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.25) touchTracking.current = true;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current || !touchTracking.current) {
      touchStart.current = null;
      touchTracking.current = false;
      return;
    }
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) turn(dx < 0 ? 1 : -1);
    touchStart.current = null;
    touchTracking.current = false;
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#17212b] px-3 py-6 text-[#f7f0df] sm:px-8 sm:py-10 landscape:min-h-0 landscape:px-2 landscape:py-1">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col landscape:min-h-0 landscape:max-w-[calc(100vw-1rem)]">
        <header className="mb-5 flex items-center justify-between sm:mb-8 landscape:mb-1">
          <Link href="/" className="inline-flex items-center gap-2 font-typewriter text-xs text-white/70 transition hover:text-white sm:text-sm landscape:text-[9px]">
            <ArrowLeft className="h-4 w-4 landscape:h-3 landscape:w-3" /> Back to scrapbook
          </Link>
          <p className="font-display text-xl sm:text-3xl landscape:text-base">The Photo Book</p>
        </header>

        <div className="flex flex-1 items-center justify-center landscape:min-h-0">
          {isLoading && <p className="font-typewriter text-white/60">Opening the book...</p>}
          {error && !hasPhotos && <p className="font-typewriter text-white/70">{error}</p>}
          {!isLoading && !error && !hasPhotos && (
            <div className="text-center">
              <p className="font-display text-3xl sm:text-5xl">Your book is waiting for its first memory.</p>
              <Link href="/" className="mt-5 inline-flex rounded-full bg-white/10 px-5 py-2 font-display text-lg hover:bg-white/20">Add photos</Link>
            </div>
          )}

          {!isLoading && hasPhotos && (
            <div className="w-full max-w-6xl landscape:flex landscape:h-[calc(100dvh-2.5rem)] landscape:flex-col landscape:justify-center">
              <div
                className="relative mx-auto flex max-w-6xl overflow-hidden rounded-lg bg-[#d8c9a9] shadow-[0_35px_90px_-25px_rgba(0,0,0,.7)] [perspective:1800px] landscape:h-[calc(100dvh-2.5rem)] landscape:w-[calc(100vw-1rem)] landscape:max-w-none landscape:rounded-md"
                style={{ touchAction: "pan-y" }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={spread}
                    initial={{ rotateY: spread > 0 ? -88 : 0, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 88, opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="flex w-full flex-col sm:flex-row landscape:flex-row"
                    style={{ transformOrigin: spread > 0 ? "left center" : "center center", transformStyle: "preserve-3d" }}
                  >
                    <PhotoPage photos={left} pageIndex={spread * 2} />
                    <div className="h-px w-full bg-black/10 sm:h-auto sm:w-px landscape:h-auto landscape:w-px" />
                    <PhotoPage photos={right} pageIndex={spread * 2 + 1} />
                  </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-6 -translate-x-1/2 bg-gradient-to-r from-black/10 via-black/5 to-black/10 sm:block landscape:block landscape:w-3" />
              </div>

              <div className="mt-5 flex items-center justify-center gap-4 sm:mt-7 sm:gap-7 landscape:mt-1 landscape:gap-3">
                <button type="button" onClick={() => turn(-1)} disabled={spread === 0} aria-label="Previous spread" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-20 sm:h-12 sm:w-12 landscape:h-7 landscape:w-7">
                  <ChevronLeft className="landscape:h-4 landscape:w-4" />
                </button>
                <span className="font-typewriter text-[9px] tracking-[.18em] text-white/55 sm:text-xs landscape:text-[7px]">SPREAD {spread + 1} / {spreadCount}</span>
                <button type="button" onClick={() => turn(1)} disabled={spread === spreadCount - 1} aria-label="Next spread" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-20 sm:h-12 sm:w-12 landscape:h-7 landscape:w-7">
                  <ChevronRight className="landscape:h-4 landscape:w-4" />
                </button>
              </div>

              <p className="mt-3 text-center font-typewriter text-[9px] text-white/35 sm:text-xs landscape:mt-0 landscape:text-[6px]">Photos are always shown in full • each page holds 3–5 photos when possible • double-spread photos count as one</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

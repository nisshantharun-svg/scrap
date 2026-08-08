"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePhotos } from "@/hooks/usePhotos";
import type { Photo } from "@/lib/types";

const PAGE_MIN = 3;
const PAGE_MAX = 5;
const SWIPE_THRESHOLD = 60;
const PHOTO_GAP = 2;

function buildPages(photos: Photo[]) {
  const pages: Photo[][] = [];
  for (let i = 0; i < photos.length; i += PAGE_MAX) pages.push(photos.slice(i, i + PAGE_MAX));
  return pages;
}

function PhotoItem({ photo, width }: { photo: Photo; width: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="relative mx-auto mb-[2px] flex break-inside-avoid items-center justify-center overflow-hidden border border-white bg-white p-px leading-none"
      style={{ width: `${width}px`, maxWidth: "100%" }}
    >
      <img
        src={photo.src}
        alt={photo.caption || photo.name}
        className="block h-auto w-full object-contain"
        draggable={false}
        onLoad={() => undefined}
      />
      {photo.caption && (
        <figcaption className="absolute bottom-1 left-1 right-1 truncate bg-white/75 px-1 py-0.5 text-center font-display text-[9px] leading-tight text-ink sm:text-xs">
          {photo.caption}
        </figcaption>
      )}
    </motion.figure>
  );
}

function PhotoColumn({ photos, widths }: { photos: Photo[]; widths: Record<string, number> }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[2px]">
      {photos.map((photo) => (
        <PhotoItem key={photo.id} photo={photo} width={widths[photo.id] ?? 0} />
      ))}
    </div>
  );
}

function PhotoPage({ photos, pageIndex }: { photos: Photo[]; pageIndex: number }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  const leftColumn = photos.filter((_, index) => index % 2 === 0);
  const rightColumn = photos.filter((_, index) => index % 2 === 1);

  useEffect(() => {
    const element = pageRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setPageSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener("resize", updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const recordRatio = (photo: Photo, image: HTMLImageElement) => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    setRatios((current) => (current[photo.id] === ratio ? current : { ...current, [photo.id]: ratio }));
  };

  const getWidths = (column: Photo[]) => {
    if (!column.length || !pageSize.width || !pageSize.height) return {};

    const columnWidth = Math.max(1, (pageSize.width - PHOTO_GAP) / 2);
    const availableHeight = Math.max(1, pageSize.height - 8);
    const known = column.every((photo) => ratios[photo.id]);

    // Until the real dimensions are known, let the browser display the photos
    // naturally rather than applying a guessed scale that can make them tiny.
    if (!known) {
      return Object.fromEntries(column.map((photo) => [photo.id, columnWidth]));
    }

    const naturalHeight = column.reduce((total, photo) => {
      const ratio = ratios[photo.id];
      return total + columnWidth / ratio;
    }, 0) + Math.max(0, column.length - 1) * PHOTO_GAP;

    const scale = Math.min(1, availableHeight / naturalHeight);
    const width = columnWidth * scale;

    return Object.fromEntries(column.map((photo) => [photo.id, width]));
  };

  const leftWidths = getWidths(leftColumn);
  const rightWidths = getWidths(rightColumn);

  return (
    <section ref={pageRef} className="paper-grain relative min-h-[52vh] flex-1 overflow-hidden bg-[#f7f5ee] px-[4px] py-[4px] sm:min-h-[58vh] sm:px-1 sm:py-1 landscape:min-h-0 landscape:px-[4px] landscape:py-[4px]">
      <div className="pointer-events-none absolute inset-0 border border-black/[0.06]" aria-hidden="true" />

      <div className="relative grid h-full min-h-[46vh] grid-cols-2 items-start gap-[2px] sm:min-h-[50vh] landscape:min-h-0">
        <div className="min-w-0">
          {leftColumn.map((photo) => (
            <div key={photo.id} className="hidden" aria-hidden="true">
              <img src={photo.src} alt="" onLoad={(event) => recordRatio(photo, event.currentTarget)} />
            </div>
          ))}
          <PhotoColumn photos={leftColumn} widths={leftWidths} />
        </div>

        <div className="min-w-0">
          {rightColumn.map((photo) => (
            <div key={photo.id} className="hidden" aria-hidden="true">
              <img src={photo.src} alt="" onLoad={(event) => recordRatio(photo, event.currentTarget)} />
            </div>
          ))}
          <PhotoColumn photos={rightColumn} widths={rightWidths} />
        </div>

        {photos.length < PAGE_MIN && (
          <Link
            href="/"
            aria-label="Add a photo"
            title="Add a photo"
            className="col-span-2 flex min-h-24 items-center justify-center border border-dashed border-ink/25 bg-white/30 text-ink/45 transition hover:border-ink/50 hover:bg-white/50 hover:text-ink/70"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-current sm:h-11 sm:w-11">
              <Plus />
            </span>
          </Link>
        )}
      </div>

      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 font-typewriter text-[7px] tracking-[.2em] text-ink/30">
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
                className="relative mx-auto flex max-w-6xl overflow-hidden rounded-lg bg-[#e8e3d5] shadow-[0_35px_90px_-25px_rgba(0,0,0,.7)] [perspective:1800px] landscape:h-[calc(100dvh-2.5rem)] landscape:w-[calc(100vw-1rem)] landscape:max-w-none landscape:rounded-md"
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
                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-5 -translate-x-1/2 bg-gradient-to-r from-black/10 via-black/5 to-black/10 sm:block landscape:block landscape:w-3" />
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

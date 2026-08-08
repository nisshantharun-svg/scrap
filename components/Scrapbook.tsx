"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { usePhotos } from "@/hooks/usePhotos";
import { Header } from "./Header";
import { PhotoCard } from "./PhotoCard";
import { PhotoSkeletonGrid } from "./PhotoSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorBanner } from "./ErrorBanner";
import { UploadButton } from "./UploadButton";
import { UploadModal } from "./UploadModal";

function ShootingStars() {
  const stars = [
    { top: "8%", left: "6%", delay: 0, duration: 2.7, size: 86 },
    { top: "25%", left: "72%", delay: 2.8, duration: 3.1, size: 72 },
    { top: "48%", left: "18%", delay: 5.4, duration: 2.9, size: 96 },
    { top: "63%", left: "82%", delay: 1.4, duration: 3.3, size: 78 },
    { top: "78%", left: "48%", delay: 7.1, duration: 2.8, size: 88 },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {stars.map((star, index) => (
        <motion.div
          key={index}
          className="absolute h-3"
          style={{ top: star.top, left: star.left, width: star.size + 18 }}
          initial={{ x: "-18vw", y: "-18vh", opacity: 0 }}
          animate={{
            x: "62vw",
            y: "62vh",
            opacity: [0, 0, 1, 1, 0],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            repeatDelay: 4 + index * 1.1,
            ease: "easeIn",
          }}
        >
          {/* Soft outer glow */}
          <div
            className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 origin-right rounded-full blur-[4px]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.35) 78%, rgba(255,255,255,0.8) 100%)",
            }}
          />

          {/* Tapered luminous trail */}
          <div
            className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 origin-right rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.35) 70%, rgba(255,255,255,0.95) 100%)",
            }}
          />

          {/* Bright head */}
          <div className="absolute right-0 top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full bg-white shadow-[0_0_4px_2px_rgba(255,255,255,0.85),0_0_12px_4px_rgba(255,255,255,0.35)]" />
        </motion.div>
      ))}
    </div>
  );
}

export function Scrapbook() {
  const {
    photos,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    addPhoto,
    refresh,
  } = usePhotos();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const showInitialError = error && photos.length === 0 && !isLoading;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ShootingStars />

      <div
        className="pointer-events-none absolute left-[8%] top-[12%] z-0 h-32 w-32 rounded-full bg-blue-200/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[10%] top-[35%] z-0 h-40 w-40 rounded-full bg-purple-300/5 blur-3xl"
        aria-hidden="true"
      />

      <UploadButton onClick={() => setIsModalOpen(true)} />

      <AnimatePresence>
        {isModalOpen && (
          <UploadModal
            onClose={() => setIsModalOpen(false)}
            onUploaded={(photo) => addPhoto(photo)}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <Header />

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="paper-grain relative rounded-sm bg-cardstock px-4 py-10 shadow-[0_24px_60px_-25px_rgba(0,0,0,0.55)] sm:px-10 sm:py-14"
        >
          <div
            className="pointer-events-none absolute inset-x-5 top-3 h-px bg-white/40 sm:inset-x-10"
            aria-hidden="true"
          />

          {isLoading && <PhotoSkeletonGrid />}

          {showInitialError && (
            <ErrorBanner message={error} onRetry={refresh} />
          )}

          {!isLoading && !showInitialError && photos.length === 0 && (
            <EmptyState />
          )}

          {!isLoading && photos.length > 0 && (
            <>
              <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
                {photos.map((photo, index) => (
                  <PhotoCard key={photo.id} photo={photo} index={index} />
                ))}
              </div>

              {error && (
                <p className="mt-8 text-center text-sm text-ink/50">
                  {error} — recent photos are still shown above.
                </p>
              )}

              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2 rounded-full px-5 py-2 font-display text-2xl text-ink/70 underline decoration-2 underline-offset-4 transition hover:bg-black/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingMore && (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                    {isLoadingMore
                      ? "Turning the page..."
                      : "Turn the page for more"}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.section>
      </div>
    </main>
  );
}

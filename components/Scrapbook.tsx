```tsx
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
      {/* Subtle decorative night-sky details */}

      {/* Soft decorative glow */}
      <div
        className="pointer-events-none absolute left-[8%] top-[12%] h-32 w-32 rounded-full bg-blue-200/5 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute right-[10%] top-[35%] h-40 w-40 rounded-full bg-purple-300/5 blur-3xl"
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
          className="
            paper-grain
            relative
            rounded-sm
            bg-cardstock
            px-4
            py-10
            shadow-[0_24px_60px_-25px_rgba(0,0,0,0.55)]
            sm:px-10
            sm:py-14
          "
        >
          {/* Subtle paper edge/highlight */}
          <div
            className="pointer-events-none absolute inset-x-5 top-3 h-px bg-white/40 sm:inset-x-10"
            aria-hidden="true"
          />

          {isLoading && <PhotoSkeletonGrid />}

          {showInitialError && (
            <ErrorBanner
              message={error}
              onRetry={refresh}
            />
          )}

          {!isLoading && !showInitialError && photos.length === 0 && (
            <EmptyState />
          )}

          {!isLoading && photos.length > 0 && (
            <>
              <div
                className="
                  columns-1
                  gap-6
                  sm:columns-2
                  lg:columns-3
                  xl:columns-4
                "
              >
                {photos.map((photo, index) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                  />
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
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      px-5
                      py-2
                      font-display
                      text-2xl
                      text-ink/70
                      underline
                      decoration-2
                      underline-offset-4
                      transition
                      hover:bg-black/5
                      hover:text-ink
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
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
```

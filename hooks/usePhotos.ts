"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo, PhotosPage } from "@/lib/types";

const PAGE_SIZE = 24;
const POLL_INTERVAL_MS = 30_000;

async function fetchPage(pageToken?: string): Promise<PhotosPage> {
  const params = new URLSearchParams({ pageSize: String(PAGE_SIZE) });
  if (pageToken) params.set("pageToken", pageToken);
  const response = await fetch(`/api/photos?${params.toString()}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Couldn't load photos.");
  }
  return response.json();
}

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  const loadFirstPage = useCallback(async (signal: { cancelled: boolean }) => {
    try {
      const page = await fetchPage();
      if (signal.cancelled) return;
      knownIds.current = new Set(page.photos.map((photo) => photo.id));
      setPhotos(page.photos);
      setNextPageToken(page.nextPageToken);
      setError(null);
    } catch (err) {
      if (!signal.cancelled) setError(err instanceof Error ? err.message : "Couldn't load photos.");
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    Promise.resolve().then(() => loadFirstPage(signal));
    return () => { signal.cancelled = true; };
  }, [loadFirstPage]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    loadFirstPage({ cancelled: false });
  }, [loadFirstPage]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const page = await fetchPage();
        const freshPhotos = page.photos.filter((photo) => !knownIds.current.has(photo.id));
        if (freshPhotos.length === 0) return;
        freshPhotos.forEach((photo) => knownIds.current.add(photo.id));
        setPhotos((current) => [...freshPhotos, ...current]);
      } catch {
        // Background polling retries silently.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const page = await fetchPage(nextPageToken);
      const freshPhotos = page.photos.filter((photo) => !knownIds.current.has(photo.id));
      freshPhotos.forEach((photo) => knownIds.current.add(photo.id));
      setPhotos((current) => [...current, ...freshPhotos]);
      setNextPageToken(page.nextPageToken);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load more photos.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageToken, isLoadingMore]);

  const addPhoto = useCallback((photo: Photo) => {
    if (knownIds.current.has(photo.id)) return;
    knownIds.current.add(photo.id);
    setPhotos((current) => [photo, ...current]);
  }, []);

  const removePhoto = useCallback(async (photo: Photo) => {
    if (!photo.canDelete) return;
    const response = await fetch(`/api/photos/${encodeURIComponent(photo.id)}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Couldn't delete that photo.");
    }
    knownIds.current.delete(photo.id);
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
  }, []);

  return {
    photos,
    isLoading,
    isLoadingMore,
    error,
    hasMore: nextPageToken !== null,
    loadMore,
    addPhoto,
    removePhoto,
    refresh,
  };
}

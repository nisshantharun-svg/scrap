"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { prepareImageForUpload } from "@/lib/image-compression";
import type { Photo } from "@/lib/types";

interface UploadModalProps {
  onClose: () => void;
  onUploaded: (photos: Photo[]) => void;
}

type Status = "idle" | "preparing" | "uploading" | "error";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

function isAcceptableFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type.startsWith("image/")) return true;
  return /\.hei[cf]$/i.test(file.name);
}

export function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(isAcceptableFile);

    if (validFiles.length !== files.length) {
      setStatus("error");
      setErrorMessage("One or more files aren't supported. Please choose JPG, PNG, WebP, or HEIC photos.");
    } else {
      setStatus("idle");
      setErrorMessage(null);
    }

    if (validFiles.length === 0) return;

    setSelectedFiles((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      return [
        ...current,
        ...validFiles.filter(
          (file) => !existing.has(`${file.name}-${file.size}-${file.lastModified}`),
        ),
      ];
    });
  }, []);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((current) => {
      current.forEach((url) => URL.revokeObjectURL(url));
      return urls;
    });

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length) selectFiles(files);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    selectFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function removeFile(index: number) {
    setSelectedFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedFiles.length || status === "preparing" || status === "uploading") return;

    setErrorMessage(null);
    const uploadedPhotos: Photo[] = [];

    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        setStatus("preparing");
        const { blob, filename } = await prepareImageForUpload(selectedFiles[index]);

        setStatus("uploading");
        const formData = new FormData();
        formData.append("file", blob, filename);
        if (caption.trim()) formData.append("caption", caption.trim());

        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? `Upload failed for photo ${index + 1}.`);
        }

        const { photo } = (await response.json()) as { photo: Photo };
        uploadedPhotos.push(photo);
        setUploadProgress(Math.round(((index + 1) / selectedFiles.length) * 100));
      }

      onUploaded(uploadedPhotos);
      onClose();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  const isBusy = status === "preparing" || status === "uploading";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative w-full max-w-lg rounded-sm bg-[#fffdf8] p-6 shadow-[0_24px_60px_-12px_rgba(51,64,77,0.5)] sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/50 hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="upload-modal-title" className="font-display text-3xl text-ink">
          Add memories
        </h2>
        <p className="mt-1 text-sm text-ink/60">Choose one or several photos to paste into the scrapbook.</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
            }}
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed px-4 py-6 text-center transition-colors ${
              isDraggingOver ? "border-rose bg-rose/5" : "border-ink/25 hover:border-ink/40"
            }`}
          >
            {selectedFiles.length > 0 ? (
              <div className="grid max-h-52 w-full grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {previewUrls.map((url, index) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-sm bg-ink/5">
                    <Image src={url} alt={`Selected photo ${index + 1}`} fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-ink/40" />
                <p className="text-sm text-ink/60">
                  Drop photos here, or <span className="text-rose underline">browse</span>
                </p>
                <p className="text-xs text-ink/40">You can select multiple JPG, PNG, WebP, or HEIC photos</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="text-sm text-rose underline disabled:opacity-50"
            >
              Add more photos
            </button>
          )}

          <div>
            <label htmlFor="caption" className="mb-1 block font-typewriter text-[11px] uppercase tracking-wide text-ink/50">
              Caption (optional)
            </label>
            <input
              id="caption"
              type="text"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={280}
              placeholder="Say something about these..."
              className="w-full border-b-2 border-ink/20 bg-transparent px-1 py-1.5 font-display text-xl text-ink placeholder:text-ink/30 focus:border-rose focus:outline-none"
            />
          </div>

          {status === "error" && errorMessage && (
            <p className="rounded-sm bg-rose/10 px-3 py-2 text-sm text-ink">{errorMessage}</p>
          )}

          {isBusy && (
            <p className="text-center text-sm text-ink/60">
              {status === "preparing" ? "Preparing photos..." : `Pasting photo ${Math.ceil((uploadProgress / 100) * selectedFiles.length) || 1} of ${selectedFiles.length}...`}
            </p>
          )}

          <button
            type="submit"
            disabled={!selectedFiles.length || isBusy}
            className="mt-1 flex items-center justify-center gap-2 rounded-sm bg-gold px-4 py-3 font-display text-xl text-[#fffdf8] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBusy && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === "preparing" && "Preparing photos..."}
            {status === "uploading" && `Pasting ${selectedFiles.length} photo${selectedFiles.length === 1 ? "" : "s"}...`}
            {(status === "idle" || status === "error") && `Paste ${selectedFiles.length || "your"} photo${selectedFiles.length === 1 ? "" : "s"} in`}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

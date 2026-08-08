import "server-only";
import { google, drive_v3 } from "googleapis";
import { Readable } from "node:stream";
import type { Photo, PhotosPage } from "./types";

const OWNER_PREFIX = "SCRAPBOOK_OWNER:";

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}. See .env.local.example.`);
  return value;
}

let driveClient: drive_v3.Drive | null = null;
function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient;
  const auth = new google.auth.OAuth2(readRequiredEnv("GOOGLE_CLIENT_ID"), readRequiredEnv("GOOGLE_CLIENT_SECRET"));
  auth.setCredentials({ refresh_token: readRequiredEnv("GOOGLE_REFRESH_TOKEN") });
  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}
function getFolderId(): string { return readRequiredEnv("GOOGLE_DRIVE_FOLDER_ID"); }

const PHOTO_FIELDS = "id, name, createdTime, mimeType, description, imageMediaMetadata(width, height)";

function parseDescription(description?: string): { caption?: string; ownerId?: string } {
  if (!description) return {};
  const match = description.match(new RegExp(`^${OWNER_PREFIX.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}([^\\n]+)(?:\\n)?([\\s\\S]*)$`));
  if (!match) return { caption: description };
  return { ownerId: match[1], caption: match[2] || undefined };
}

function toPhoto(file: drive_v3.Schema$File, ownerId?: string): Photo {
  const metadata = parseDescription(file.description);
  return {
    id: file.id!, name: file.name ?? "Untitled", src: `/api/image/${file.id}`,
    createdTime: file.createdTime ?? new Date().toISOString(),
    width: file.imageMediaMetadata?.width ?? undefined,
    height: file.imageMediaMetadata?.height ?? undefined,
    caption: metadata.caption,
    canDelete: Boolean(ownerId && metadata.ownerId === ownerId),
  };
}

const FIRST_PAGE_TTL_MS = 15_000;
let firstPageCache: { data: PhotosPage; expiresAt: number; ownerId?: string } | null = null;
export function invalidatePhotoCache(): void { firstPageCache = null; }

export async function listPhotos(options: { pageToken?: string; pageSize?: number; ownerId?: string }): Promise<PhotosPage> {
  const { pageToken, pageSize = 24, ownerId } = options;
  if (!pageToken && firstPageCache && firstPageCache.expiresAt > Date.now() && firstPageCache.ownerId === ownerId) return firstPageCache.data;
  const drive = getDriveClient();
  const response = await drive.files.list({
    q: `'${getFolderId()}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: `nextPageToken, files(${PHOTO_FIELDS})`, orderBy: "createdTime desc", pageSize, pageToken, spaces: "drive",
  });
  const page: PhotosPage = { photos: (response.data.files ?? []).map((file) => toPhoto(file, ownerId)), nextPageToken: response.data.nextPageToken ?? null };
  if (!pageToken) firstPageCache = { data: page, expiresAt: Date.now() + FIRST_PAGE_TTL_MS, ownerId };
  return page;
}

export async function uploadPhoto(input: { buffer: Buffer; filename: string; mimeType: string; caption?: string; ownerId: string }): Promise<Photo> {
  const drive = getDriveClient();
  const description = `${OWNER_PREFIX}${input.ownerId}${input.caption ? `\n${input.caption}` : ""}`;
  const response = await drive.files.create({
    requestBody: { name: input.filename, parents: [getFolderId()], description },
    media: { mimeType: input.mimeType, body: Readable.from(input.buffer) }, fields: PHOTO_FIELDS,
  });
  invalidatePhotoCache();
  return toPhoto(response.data, input.ownerId);
}

export async function deletePhoto(fileId: string, ownerId: string): Promise<void> {
  const drive = getDriveClient();
  const response = await drive.files.get({ fileId, fields: "id, description, parents, mimeType" });
  const metadata = parseDescription(response.data.description);
  if (metadata.ownerId !== ownerId) throw new Error("You can only delete photos you uploaded from this browser.");
  if (!response.data.parents?.includes(getFolderId())) throw new Error("That photo is not in the scrapbook folder.");
  await drive.files.delete({ fileId });
  invalidatePhotoCache();
}

export async function fetchPhotoBytes(fileId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const drive = getDriveClient();
  const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
  const mimeType = (response.headers as Record<string, string>)["content-type"] ?? "application/octet-stream";
  return { buffer: Buffer.from(response.data as ArrayBuffer), mimeType };
}

/**
 * A photo as the frontend understands it. Built from a Google Drive file
 * by lib/google-drive.ts — nothing in components ever sees raw Drive fields.
 */
export interface Photo {
  id: string;
  name: string;
  src: string;
  createdTime: string;
  width?: number;
  height?: number;
  caption?: string;
  /** True only when this browser created the photo. */
  canDelete?: boolean;
}

export interface PhotosPage {
  photos: Photo[];
  nextPageToken: string | null;
}

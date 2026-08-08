import { NextRequest } from "next/server";
import { fetchPhotoBytes } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return new Response("Invalid photo ID", { status: 400 });
  }

  try {
    const { buffer, mimeType } = await fetchPhotoBytes(id);
    return new Response(buffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": "attachment; filename=\"photo.jpg\"",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Unable to download this photo", { status: 404 });
  }
}

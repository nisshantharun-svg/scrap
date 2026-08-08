import { NextRequest, NextResponse } from "next/server";
import { listPhotos } from "@/lib/google-drive";
import { ensureOwnerId } from "@/lib/ownership";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pageToken = searchParams.get("pageToken") ?? undefined;
  const pageSizeParam = searchParams.get("pageSize");
  const pageSize = pageSizeParam ? Number(pageSizeParam) : 24;
  if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > 100) return NextResponse.json({ error: "pageSize must be a number between 1 and 100." }, { status: 400 });

  try {
    const response = NextResponse.json(null);
    const ownerId = ensureOwnerId(request, response);
    const page = await listPhotos({ pageToken, pageSize, ownerId });
    const result = NextResponse.json(page, { headers: { "Cache-Control": "no-store" } });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) result.headers.set("set-cookie", setCookie);
    return result;
  } catch (error) {
    console.error("GET /api/photos failed:", error);
    return NextResponse.json({ error: "Couldn't load photos from Google Drive. Double-check your environment variables and that the Drive folder still exists." }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { deletePhoto } from "@/lib/google-drive";
import { getOwnerId } from "@/lib/ownership";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const ownerId = getOwnerId(request);
  if (!ownerId) return NextResponse.json({ error: "You can only delete photos uploaded from this browser." }, { status: 403 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing photo id." }, { status: 400 });

  try {
    await deletePhoto(id, ownerId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn't delete that photo.";
    const status = message.includes("only delete") ? 403 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

import "server-only";

import { NextRequest, NextResponse } from "next/server";

export const OWNER_COOKIE = "scrapbook-owner";

export function getOwnerId(request: NextRequest): string | null {
  return request.cookies.get(OWNER_COOKIE)?.value ?? null;
}

export function ensureOwnerId(request: NextRequest, response: NextResponse): string {
  const existing = getOwnerId(request);
  if (existing) return existing;

  const ownerId = crypto.randomUUID();
  response.cookies.set(OWNER_COOKIE, ownerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 2,
  });
  return ownerId;
}

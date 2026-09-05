import { NextRequest, NextResponse } from "next/server";
import { login, logout, sessionUser } from "@/lib/server/store";
import { body, failure, sameOrigin } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { try { return NextResponse.json({ user: sessionUser(request.cookies.get("diip-session")?.value), demo: process.env.NODE_ENV !== "production" || process.env.DIIP_DEMO === "true" }, { headers: { "Cache-Control": "no-store" } }); } catch (e) { return failure(e); } }
export async function POST(request: NextRequest) {
  try { sameOrigin(request); const input = await body(request); if (typeof input.email !== "string" || typeof input.password !== "string" || input.password.length > 128 || input.email.length > 254) throw new Error("Revisa tus credenciales."); const { token, user } = login(input.email, input.password); const response = NextResponse.json({ user }); response.cookies.set("diip-session", token, { httpOnly: true, sameSite: "strict", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 28800 }); return response; } catch (e) { return failure(e, 401); }
}
export async function DELETE(request: NextRequest) { try { sameOrigin(request); const token = request.cookies.get("diip-session")?.value; if (token) logout(token); const response = NextResponse.json({ ok: true }); response.cookies.delete("diip-session"); return response; } catch (e) { return failure(e); } }

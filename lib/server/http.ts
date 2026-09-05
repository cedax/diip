import { NextRequest, NextResponse } from "next/server";
import { sessionUser } from "./store";
export function actor(request: NextRequest) { const user = sessionUser(request.cookies.get("diip-session")?.value); if (!user) throw new Error("Sesión vencida. Inicia sesión nuevamente."); return user; }
export function sameOrigin(request: NextRequest) { const origin = request.headers.get("origin"); if (!origin || origin !== new URL(request.url).origin) throw new Error("Origen de solicitud no permitido."); }
export function failure(error: unknown, status = 400) { return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible completar la operación." }, { status, headers: { "Cache-Control": "no-store" } }); }
export async function body(request: NextRequest) { const text = await request.text(); if (text.length > 8000000) throw new Error("La solicitud es demasiado grande. Divide el lote."); return JSON.parse(text); }

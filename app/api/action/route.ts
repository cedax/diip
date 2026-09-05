import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/server/store";
import { actor, body, failure, sameOrigin } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) { try { sameOrigin(request); const user = actor(request); const input = await body(request); if (!input.action || !Number.isInteger(input.version)) throw new Error("Solicitud incompleta."); return NextResponse.json(mutate(input.action, user, input.version), { headers: { "Cache-Control": "no-store" } }); } catch(e) { return failure(e); } }

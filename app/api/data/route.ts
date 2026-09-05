import { NextRequest, NextResponse } from "next/server";
import { snapshot } from "@/lib/server/store";
import { actor, failure } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { try { return NextResponse.json(snapshot(actor(request)), { headers: { "Cache-Control": "no-store" } }); } catch(e) { return failure(e, 401); } }

import { NextResponse } from "next/server";
import {
  ensurePredictionRefreshLoop,
  readPredictionPayload,
  refreshPredictions,
} from "@/lib/predictions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projectRoot = process.cwd();
  ensurePredictionRefreshLoop(projectRoot);

  try {
    await refreshPredictions({ projectRoot });
  } catch {
    // Fall back to the latest persisted prediction file if regeneration fails.
  }

  try {
    const raw = await readPredictionPayload(projectRoot);
    return new NextResponse(raw, {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "x-model-refresh": "runtime-refresh-loop",
      },
    });
  } catch {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }
}

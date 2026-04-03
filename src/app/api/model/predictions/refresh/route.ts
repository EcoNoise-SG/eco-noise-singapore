import { NextRequest, NextResponse } from "next/server";
import { ensurePredictionRefreshLoop, readPredictionPayload, refreshPredictions } from "@/lib/predictions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const queryToken = request.nextUrl.searchParams.get("secret");
  return bearerToken === configuredSecret || queryToken === configuredSecret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectRoot = process.cwd();
  ensurePredictionRefreshLoop(projectRoot);

  try {
    const result = await refreshPredictions({
      projectRoot,
      force: true,
    });

    const payload = await readPredictionPayload(projectRoot);
    return new NextResponse(payload, {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "x-model-refresh": result.refreshed ? "scheduled-refresh" : "scheduled-cache-hit",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Prediction refresh failed",
        detail: error instanceof Error ? error.message : "Unknown refresh error",
      },
      { status: 500 },
    );
  }
}

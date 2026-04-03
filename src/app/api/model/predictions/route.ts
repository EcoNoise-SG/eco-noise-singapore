import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function runPredictionScript(projectRoot: string) {
  return await new Promise<void>((resolve, reject) => {
    const child = spawn("python", ["ml/generate_predictions.py"], {
      cwd: projectRoot,
      stdio: "ignore",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Prediction script exited with code ${code}`));
    });
  });
}

async function isPredictionFileFresh(predictionFile: string, freshnessWindowMs = 5 * 60 * 1000) {
  try {
    const stats = await fs.stat(predictionFile);
    return Date.now() - stats.mtimeMs < freshnessWindowMs;
  } catch {
    return false;
  }
}

export async function GET() {
  const projectRoot = process.cwd();
  const predictionFile = path.join(projectRoot, "public", "model-output", "latest_predictions.json");

  try {
    const isFresh = await isPredictionFileFresh(predictionFile);
    if (!isFresh) {
      await runPredictionScript(projectRoot);
    }
  } catch {
    // Fall back to the latest persisted prediction file if regeneration fails.
  }

  try {
    const raw = await fs.readFile(predictionFile, "utf8");
    return new NextResponse(raw, {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "x-model-refresh": "on-demand-stale-refresh",
      },
    });
  } catch {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }
}

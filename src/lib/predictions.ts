import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";

export const PREDICTION_REFRESH_WINDOW_MS = 5 * 60 * 1000;

let refreshLoopInitialized = false;
let refreshInFlight: Promise<void> | null = null;

export function getPredictionFilePath(projectRoot = process.cwd()) {
  return path.join(projectRoot, "public", "model-output", "latest_predictions.json");
}

export async function runPredictionScript(projectRoot = process.cwd()) {
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

export async function isPredictionFileFresh(
  predictionFile = getPredictionFilePath(),
  freshnessWindowMs = PREDICTION_REFRESH_WINDOW_MS,
) {
  try {
    const stats = await fs.stat(predictionFile);
    return Date.now() - stats.mtimeMs < freshnessWindowMs;
  } catch {
    return false;
  }
}

export function ensurePredictionRefreshLoop(projectRoot = process.cwd()) {
  if (refreshLoopInitialized) return;

  refreshLoopInitialized = true;
  const interval = setInterval(() => {
    refreshInFlight = runPredictionScript(projectRoot).catch(() => undefined).finally(() => {
      refreshInFlight = null;
    });
  }, PREDICTION_REFRESH_WINDOW_MS);

  interval.unref?.();
}

export async function refreshPredictions({
  projectRoot = process.cwd(),
  force = false,
}: {
  projectRoot?: string;
  force?: boolean;
} = {}) {
  const predictionFile = getPredictionFilePath(projectRoot);
  const isFresh = await isPredictionFileFresh(predictionFile);

  if (!force && isFresh) {
    return { refreshed: false, predictionFile };
  }

  refreshInFlight = refreshInFlight || runPredictionScript(projectRoot).finally(() => {
    refreshInFlight = null;
  });
  await refreshInFlight;

  return { refreshed: true, predictionFile };
}

export async function readPredictionPayload(projectRoot = process.cwd()) {
  const predictionFile = getPredictionFilePath(projectRoot);
  const raw = await fs.readFile(predictionFile, "utf8");
  return raw;
}

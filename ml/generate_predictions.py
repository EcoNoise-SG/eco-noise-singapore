from __future__ import annotations

import json
from datetime import datetime, UTC
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "artifacts" / "risk_model.json"
SIGNALS_PATH = ROOT / "data" / "runtime_signals.json"
OUTPUT_PATH = ROOT.parent / "public" / "model-output" / "latest_predictions.json"


def load_json(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def predict(model: dict, signal: dict) -> float:
    score = float(model["bias"])
    for feature in model["features"]:
        stats = model["feature_stats"][feature]
        normalized = (float(signal[feature]) - float(stats["mean"])) / float(stats["std"])
        score += float(model["weights"][feature]) * normalized
    return max(0.0, min(100.0, score))


def main() -> None:
    model = load_json(MODEL_PATH)
    signals = load_json(SIGNALS_PATH)

    predictions = []
    for signal in signals:
        predicted_score = predict(model, signal)
        confidence = max(0.55, min(0.96, 1.0 - (float(model["train_mae"]) / 100.0)))
        predictions.append({
            "area": signal["area"],
            "predicted_score": round(predicted_score, 2),
            "confidence": round(confidence, 2),
            "primary_driver": signal["primary_driver"],
            "recommended_action": signal["recommended_action"],
        })

    payload = {
        "generated_at": datetime.now(UTC).isoformat(),
        "model_version": "starter-linear-v1",
        "predictions": predictions,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote predictions to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

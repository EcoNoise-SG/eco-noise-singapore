from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "training_data.csv"
ARTIFACT_PATH = ROOT / "artifacts" / "risk_model.json"
FEATURES = ["temperature", "pm25", "humidity", "active_alerts", "active_interventions"]
TARGET = "risk_score"


def read_rows() -> list[dict[str, float]]:
    with DATA_PATH.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return [
            {key: float(value) if key != "area" else value for key, value in row.items()}
            for row in reader
        ]


def mean(values: list[float]) -> float:
    return sum(values) / max(len(values), 1)


def std(values: list[float], avg: float) -> float:
    variance = sum((value - avg) ** 2 for value in values) / max(len(values), 1)
    return variance ** 0.5 or 1.0


def train_linear_regression(rows: list[dict[str, float]]) -> dict[str, object]:
    feature_stats = {}
    for feature in FEATURES:
        values = [float(row[feature]) for row in rows]
        avg = mean(values)
        feature_stats[feature] = {"mean": avg, "std": std(values, avg)}

    weights = {feature: 0.0 for feature in FEATURES}
    bias = 0.0
    learning_rate = 0.01
    epochs = 2500

    for _ in range(epochs):
        bias_gradient = 0.0
        weight_gradients = {feature: 0.0 for feature in FEATURES}

        for row in rows:
            normalized = {
                feature: (float(row[feature]) - feature_stats[feature]["mean"]) / feature_stats[feature]["std"]
                for feature in FEATURES
            }
            prediction = bias + sum(weights[feature] * normalized[feature] for feature in FEATURES)
            error = prediction - float(row[TARGET])
            bias_gradient += error
            for feature in FEATURES:
                weight_gradients[feature] += error * normalized[feature]

        sample_count = max(len(rows), 1)
        bias -= learning_rate * (bias_gradient / sample_count)
        for feature in FEATURES:
            weights[feature] -= learning_rate * (weight_gradients[feature] / sample_count)

    predictions = []
    for row in rows:
        normalized = {
            feature: (float(row[feature]) - feature_stats[feature]["mean"]) / feature_stats[feature]["std"]
            for feature in FEATURES
        }
        prediction = bias + sum(weights[feature] * normalized[feature] for feature in FEATURES)
        predictions.append(prediction)

    mae = mean([
        abs(prediction - float(row[TARGET]))
        for prediction, row in zip(predictions, rows, strict=False)
    ])

    return {
        "features": FEATURES,
        "bias": bias,
        "weights": weights,
        "feature_stats": feature_stats,
        "train_mae": mae,
        "samples": len(rows),
    }


def main() -> None:
    rows = read_rows()
    model = train_linear_regression(rows)
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(model, indent=2), encoding="utf-8")
    print(f"Saved model to {ARTIFACT_PATH}")
    print(f"Training MAE: {model['train_mae']:.2f}")


if __name__ == "__main__":
    main()

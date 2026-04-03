# Realtime ML Modeling

This folder bootstraps a Python modeling workflow that can run alongside the dashboard.

## What it does

- `train_model.py`
  Trains a lightweight risk regression model from CSV data and saves weights to `ml/artifacts/risk_model.json`.
- `generate_predictions.py`
  Loads the saved model, scores current area signals, and writes the dashboard-readable file at `public/model-output/latest_predictions.json`.

## Quick start

```bash
python ml/train_model.py
python ml/generate_predictions.py
```

## Data contract

- Training input: `ml/data/training_data.csv`
- Runtime inference input: `ml/data/runtime_signals.json`
- Model artifact: `ml/artifacts/risk_model.json`
- Dashboard output: `public/model-output/latest_predictions.json`

## Next steps

- Replace sample training data with exported historical alert/intervention/weather records
- Schedule `generate_predictions.py` on a recurring job
- Feed richer geospatial features from the production pipeline

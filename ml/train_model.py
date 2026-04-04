import pandas as pd
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "training_data.csv"
ARTIFACT_PATH = ROOT / "artifacts" / "risk_model.pkl"

def main():
    print(f"Loading training data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    # Define features and target
    target = "risk_score"
    X = df.drop(columns=[target, "area"])
    y = df[target]

    # Categorical vs Numerical features
    categorical_features = ["work_phase"]
    numerical_features = ["wbgt", "temperature", "humidity", "pm25", "contractor_tier", "active_workers", "historical_incidents", "active_alerts", "active_interventions"]

    # Build the Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numerical_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )

    # Build the full ML Pipeline (Preprocessor + Random Forest)
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, random_state=42, max_depth=5))
    ])

    print("Training Random Forest Regressor on historical datasets...")
    pipeline.fit(X, y)

    # Verify accuracy
    predictions = pipeline.predict(X)
    mae = mean_absolute_error(y, predictions)
    r2 = r2_score(y, predictions)
    
    print(f"Training Complete. Performance Metrics:")
    print(f" - Mean Absolute Error (MAE): {mae:.2f}")
    print(f" - R2 Score (Accuracy): {r2:.2f}")

    # Identify most important features (just for insights)
    # Get feature names after one-hot encoding
    cat_features_encoded = pipeline.named_steps["preprocessor"].transformers_[1][1].get_feature_names_out(categorical_features)
    all_feature_names = numerical_features + list(cat_features_encoded)
    importances = pipeline.named_steps["regressor"].feature_importances_
    
    print("\nFeature Importances (Top 3):")
    feature_importance_df = pd.DataFrame({"Feature": all_feature_names, "Importance": importances})
    feature_importance_df = feature_importance_df.sort_values(by="Importance", ascending=False)
    print(feature_importance_df.head(3).to_string(index=False))

    # Save artifact
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, ARTIFACT_PATH)
    print(f"\nSaved ML Model Pipeline to {ARTIFACT_PATH}")

if __name__ == "__main__":
    main()

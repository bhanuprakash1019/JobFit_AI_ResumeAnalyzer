import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

df = pd.read_csv("../dataset/hiring_outcomes.csv")

features = [
    "experience_years",
    "skills_match_ratio"
]

df = df.dropna(subset=features + ["decision_label"])

X = df[features]
y = df["decision_label"].astype(int)

if y.nunique() != 2:
    raise ValueError("Both outcome classes are required.")

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

model = make_pipeline(
    StandardScaler(),
    LogisticRegression(
        max_iter=1000,
        class_weight="balanced"
    )
)

model.fit(X_train, y_train)
predictions = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, predictions))
print("Precision:", precision_score(
    y_test, predictions, zero_division=0
))
print("Recall:", recall_score(
    y_test, predictions, zero_division=0
))
print("F1-score:", f1_score(
    y_test, predictions, zero_division=0
))
print("Confusion matrix:\n", confusion_matrix(
    y_test, predictions
))
print(classification_report(
    y_test, predictions, zero_division=0
))

joblib.dump(model, "../models/rejection_model.joblib")
joblib.dump(features, "../models/features.joblib")
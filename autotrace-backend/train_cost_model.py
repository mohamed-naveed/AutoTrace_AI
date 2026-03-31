import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
import joblib

# Load dataset
data = pd.read_csv("historical_fttp_costs.csv")

# Encode categorical features
le_area = LabelEncoder()
le_build = LabelEncoder()
le_complexity = LabelEncoder()

data["area_type"] = le_area.fit_transform(data["area_type"])
data["build_type"] = le_build.fit_transform(data["build_type"])
data["complexity"] = le_complexity.fit_transform(data["complexity"])

# Features
X = data[["distance_km","area_type","build_type","complexity"]]

# Target
y = data["cost"]

# Train model
model = LinearRegression()
model.fit(X,y)

# Save model
joblib.dump(model,"cost_model.pkl")

# Save encoders
joblib.dump(le_area,"area_encoder.pkl")
joblib.dump(le_build,"build_encoder.pkl")
joblib.dump(le_complexity,"complexity_encoder.pkl")

print("Model trained successfully")
